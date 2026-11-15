package com.newtin.eco.service;

import com.newtin.eco.dto.request.CartCheckoutRequest;
import com.newtin.eco.dto.request.CartItemRequest;
import com.newtin.eco.dto.request.CreateOrderRequest;
import com.newtin.eco.dto.request.OrderLineRequest;
import com.newtin.eco.dto.request.UpdateCartItemRequest;
import com.newtin.eco.dto.response.CartItemResponse;
import com.newtin.eco.dto.response.CartResponse;
import com.newtin.eco.dto.response.OrderResponse;
import com.newtin.eco.enums.CartStatus;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.CartItem;
import com.newtin.eco.model.Customer;
import com.newtin.eco.model.ShoppingCart;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.OrderCatalogRepository;
import com.newtin.eco.repository.OrderCatalogRepository.VariantOrderDetails;
import com.newtin.eco.repository.ShoppingCartRepository;
import com.newtin.eco.repository.PromotionRepository.ApplicablePromotion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CartService {
    private final ShoppingCartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final OrderCatalogRepository catalogRepository;
    private final PromotionService promotionService;
    private final OrderService orderService;

    @Transactional
    public CartResponse getActive(Long customerId) {
        return response(activeCart(customerId));
    }

    @Transactional
    public CartResponse add(Long customerId, CartItemRequest request) {
        ShoppingCart cart = activeCart(customerId);
        VariantOrderDetails variant = findVariant(request.variantItemId());
        ensureAvailable(variant);
        CartItem item = cart.getItems().stream()
                .filter(existing -> existing.getVariantItem().getId().equals(request.variantItemId()))
                .findFirst().orElse(null);
        long quantity = request.quantity();
        if (item != null) quantity += item.getQuantity();
        ensureStock(variant, quantity);
        if (item == null) {
            item = CartItem.builder().cart(cart)
                    .variantItem(catalogRepository.getReferenceById(request.variantItemId()))
                    .quantity(request.quantity()).build();
            cart.getItems().add(item);
        } else {
            item.setQuantity(Math.toIntExact(quantity));
        }
        return response(cart);
    }

    @Transactional
    public CartResponse setQuantity(Long customerId, Long variantItemId, UpdateCartItemRequest request) {
        ShoppingCart cart = activeCart(customerId);
        CartItem item = cart.getItems().stream()
                .filter(existing -> existing.getVariantItem().getId().equals(variantItemId))
                .findFirst().orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        VariantOrderDetails variant = findVariant(variantItemId);
        ensureAvailable(variant);
        ensureStock(variant, request.quantity());
        item.setQuantity(request.quantity());
        return response(cart);
    }

    @Transactional
    public void abandon(Long customerId) {
        ShoppingCart cart = cartRepository.findByCustomerIdAndStatus(customerId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active cart not found"));
        cart.setStatus(CartStatus.ABANDONED);
    }

    @Transactional
    public void remove(Long customerId, Long variantItemId) {
        ShoppingCart cart = activeCart(customerId);
        CartItem item = cart.getItems().stream()
                .filter(existing -> existing.getVariantItem().getId().equals(variantItemId))
                .findFirst().orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        cart.getItems().remove(item);
    }

    @Transactional
    public OrderResponse checkout(Long customerId, CartCheckoutRequest request) {
        ShoppingCart cart = activeCart(customerId);
        if (cart.getItems().isEmpty()) throw new ConflictException("Cannot check out an empty cart");
        List<OrderLineRequest> lines = cart.getItems().stream()
                .map(item -> new OrderLineRequest(item.getVariantItem().getId(), item.getQuantity()))
                .toList();
        OrderResponse order = orderService.create(customerId,
                new CreateOrderRequest(request.shippingAddressId(), request.billingAddressId(), lines));
        cart.setStatus(CartStatus.COMPLETED);
        return order;
    }

    private CartResponse response(ShoppingCart cart) {
        if (cart.getItems().isEmpty())
            return new CartResponse(cart.getId(), cart.getStatus(), cart.getCreatedAt(), cart.getUpdatedAt(),
                    List.of(), BigDecimal.ZERO.setScale(2));

        List<Long> variantIds = cart.getItems().stream()
                .map(item -> item.getVariantItem().getId()).toList();
        List<VariantOrderDetails> variants = catalogRepository.findOrderDetails(variantIds);
        Map<Long, VariantOrderDetails> byId = new HashMap<>();
        variants.forEach(variant -> byId.put(variant.getVariantItemId(), variant));
        if (byId.size() != variantIds.size())
            throw new ConflictException("A product in this cart is no longer available");
        List<ApplicablePromotion> promotions = promotionService.applicableForProducts(
                variants.stream().map(VariantOrderDetails::getProductId).distinct().toList());
        BigDecimal total = BigDecimal.ZERO;
        var responseItems = cart.getItems().stream().map(item -> {
            VariantOrderDetails variant = byId.get(item.getVariantItem().getId());
            var applied = promotionService.bestForPrice(variant.getProductId(), variant.getUnitPrice(), promotions);
            BigDecimal unitPrice = applied == null ? variant.getUnitPrice() : applied.discountedPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            return new CartItemResponse(variant.getVariantItemId(), variant.getProductId(),
                    variant.getProductName(), variant.getImageUrl(), variant.getVariantDescription(), item.getQuantity(),
                    variant.getStockQuantity(), variant.getUnitPrice(), unitPrice, subtotal, applied);
        }).toList();
        for (CartItemResponse item : responseItems) total = total.add(item.subtotal());
        return new CartResponse(cart.getId(), cart.getStatus(), cart.getCreatedAt(), cart.getUpdatedAt(),
                responseItems, total);
    }

    private ShoppingCart activeCart(Long customerId) {
        return cartRepository.findByCustomerIdAndStatus(customerId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    Customer customer = customerRepository.findById(customerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
                    return cartRepository.save(ShoppingCart.builder().customer(customer).build());
                });
    }

    private VariantOrderDetails findVariant(Long variantItemId) {
        return catalogRepository.findOrderDetails(List.of(variantItemId)).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
    }

    private void ensureAvailable(VariantOrderDetails variant) {
        if (!variant.getVariantActive() || !variant.getProductActive())
            throw new ConflictException("Product variant is unavailable");
        if (variant.getUnitPrice().signum() < 0)
            throw new ConflictException("Product variant has an invalid price");
    }

    private void ensureStock(VariantOrderDetails variant, long quantity) {
        if (quantity > Integer.MAX_VALUE || quantity > variant.getStockQuantity())
            throw new ConflictException("Product variant has insufficient stock");
    }
}
