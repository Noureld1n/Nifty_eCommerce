package com.newtin.eco.service;

import com.newtin.eco.dto.request.CreateOrderRequest;
import com.newtin.eco.dto.request.OrderLineRequest;
import com.newtin.eco.dto.request.UpdateShipmentRequest;
import com.newtin.eco.dto.response.OrderResponse;
import com.newtin.eco.dto.response.ShipmentResponse;
import com.newtin.eco.enums.OrderStatus;
import com.newtin.eco.enums.PaymentStatus;
import com.newtin.eco.enums.ShipmentStatus;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.Address;
import com.newtin.eco.model.Order;
import com.newtin.eco.model.OrderItem;
import com.newtin.eco.model.Shipment;
import com.newtin.eco.model.VariantItem;
import com.newtin.eco.repository.AddressRepository;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.OrderCatalogRepository;
import com.newtin.eco.repository.OrderCatalogRepository.VariantOrderDetails;
import com.newtin.eco.repository.OrderRepository;
import com.newtin.eco.repository.ShipmentRepository;
import com.newtin.eco.repository.PromotionRepository.ApplicablePromotion;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;
    private final OrderCatalogRepository catalogRepository;
    private final PromotionService promotionService;

    @Transactional
    public OrderResponse create(Long customerId, CreateOrderRequest request) {
        Address shippingAddress = findAddress(customerId, request.shippingAddressId());
        Address billingAddress = request.billingAddressId() == null
                ? shippingAddress : findAddress(customerId, request.billingAddressId());
        Set<Long> variantIds = new HashSet<>();
        for (OrderLineRequest item : request.items()) {
            if (!variantIds.add(item.variantItemId()))
                throw new BadRequestException("Each product variant can appear only once per order");
        }

        var catalogItems = catalogRepository.findOrderDetails(variantIds);
        Map<Long, VariantOrderDetails> variants = new HashMap<>();
        catalogItems.forEach(details -> variants.put(details.getVariantItemId(), details));
        if (variants.size() != variantIds.size() || catalogItems.size() != variantIds.size())
            throw new ResourceNotFoundException("Product variant not found");
        List<ApplicablePromotion> promotions = promotionService.applicableForProducts(
                catalogItems.stream().map(VariantOrderDetails::getProductId).distinct().toList());

        BigDecimal total = BigDecimal.ZERO;
        for (OrderLineRequest line : request.items()) {
            VariantOrderDetails variant = variants.get(line.variantItemId());
            if (!variant.getVariantActive() || !variant.getProductActive())
                throw new ConflictException("A product in this order is unavailable");
            if (variant.getUnitPrice().signum() < 0)
                throw new ConflictException("A product in this order has an invalid price");
            if (variant.getStockQuantity() < line.quantity())
                throw new ConflictException("A product in this order has insufficient stock");
            var applied = promotionService.bestForPrice(variant.getProductId(), variant.getUnitPrice(), promotions);
            BigDecimal purchasePrice = applied == null ? variant.getUnitPrice() : applied.discountedPrice();
            total = total.add(purchasePrice.multiply(BigDecimal.valueOf(line.quantity())));
        }

        Order order = Order.builder()
                .customer(customerRepository.getReferenceById(customerId))
                .shippingAddress(shippingAddress)
                .billingAddress(billingAddress)
                .totalPrice(total)
                .build();

        for (OrderLineRequest line : request.items()) {
            VariantOrderDetails details = variants.get(line.variantItemId());
            if (catalogRepository.reserveStock(line.variantItemId(), line.quantity()) != 1)
                throw new ConflictException("A product in this order no longer has sufficient stock");

            VariantItem variantItem = catalogRepository.getReferenceById(line.variantItemId());
            var applied = promotionService.bestForPrice(details.getProductId(), details.getUnitPrice(), promotions);
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .variantItem(variantItem)
                    .quantity(line.quantity())
                    .priceAtPurchase(applied == null ? details.getUnitPrice() : applied.discountedPrice())
                    .productNameAtPurchase(details.getProductName())
                    .variantDescriptionAtPurchase(details.getVariantDescription())
                    .build());
        }

        orderRepository.saveAndFlush(order);
        Shipment shipment = shipmentRepository.save(Shipment.builder().order(order).build());
        order.setShipment(shipment);
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> listMine(Long customerId, Pageable pageable) {
        return orderRepository.findMine(customerId, pageable).map(OrderResponse::from);
    }

    @Transactional(readOnly = true)
    public OrderResponse getMine(Long customerId, Long orderId) {
        return OrderResponse.from(findMine(customerId, orderId));
    }

    @Transactional
    public OrderResponse cancelMine(Long customerId, Long orderId) {
        Order order = findMine(customerId, orderId);
        if (order.getStatus() != OrderStatus.PENDING)
            throw new ConflictException("Only pending orders can be cancelled");
        transition(order, OrderStatus.CANCELLED);
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> listAll(OrderStatus status, PaymentStatus paymentStatus, Pageable pageable) {
        return orderRepository.searchForAdmin(status, paymentStatus, pageable).map(OrderResponse::from);
    }

    @Transactional(readOnly = true)
    public OrderResponse getAny(Long orderId) {
        return OrderResponse.from(findOrder(orderId));
    }

    @Transactional
    public OrderResponse setOrderStatus(Long orderId, OrderStatus status) {
        Order order = findOrder(orderId);
        transition(order, status);
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse setPaymentStatus(Long orderId, PaymentStatus status) {
        Order order = findOrder(orderId);
        order.setPaymentStatus(status);
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse updateShipment(Long orderId, UpdateShipmentRequest request) {
        Order order = findOrder(orderId);
        Shipment shipment = shipmentRepository.findByOrderId(orderId).orElseGet(() ->
                Shipment.builder().order(order).build());

        shipment.setTrackingNumber(trimToNull(request.trackingNumber()));
        shipment.setCarrier(trimToNull(request.carrier()));
        shipment.setExpectedDeliveryAt(request.expectedDeliveryAt());
        shipment.setStatus(request.status());
        shipment.setDelivered(request.status() == ShipmentStatus.DELIVERED);
        if (shipment.isDelivered() && shipment.getActualDeliveryAt() == null)
            shipment.setActualDeliveryAt(LocalDateTime.now());
        order.setShipment(shipment);
        shipmentRepository.saveAndFlush(shipment);
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getShipment(Long customerId, Long orderId, boolean admin) {
        Order order = admin ? findOrder(orderId) : findMine(customerId, orderId);
        return shipmentRepository.findByOrderId(order.getId())
                .map(ShipmentResponse::from)
                .orElse(null);
    }

    private Order findMine(Long customerId, Long orderId) {
        return orderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private Address findAddress(Long customerId, Long addressId) {
        return addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
    }

    private void transition(Order order, OrderStatus next) {
        OrderStatus current = order.getStatus();
        if (current == next) return;
        boolean allowed = switch (current) {
            case PENDING -> next == OrderStatus.PROCESSING || next == OrderStatus.CANCELLED;
            case PROCESSING -> next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
        if (!allowed)
            throw new ConflictException("Order cannot move from " + current + " to " + next);
        if (next == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                catalogRepository.releaseStock(item.getVariantItem().getId(), item.getQuantity());
            }
        }
        order.setStatus(next);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
