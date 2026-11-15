package com.newtin.eco.service;

import com.newtin.eco.dto.response.WishListItemResponse;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.Customer;
import com.newtin.eco.model.Product;
import com.newtin.eco.model.WishListItem;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.ProductImageRepository;
import com.newtin.eco.repository.ProductRepository;
import com.newtin.eco.repository.WishListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishListService {
    private final WishListRepository wishListRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final ProductImageRepository productImageRepository;

    @Transactional(readOnly = true)
    public List<WishListItemResponse> listMine(Long customerId) {
        List<WishListItem> items = wishListRepository.findByCustomerIdOrderByAddedAtDesc(customerId);
        if (items.isEmpty()) return List.of();
        List<Long> productIds = items.stream().map(item -> item.getProduct().getId()).toList();
        Map<Long, String> imageUrls = productImageRepository.findPrimaryImagesByProductIds(productIds).stream()
                .collect(Collectors.toMap(ProductImageRepository.ProductPrimaryImage::getProductId,
                        ProductImageRepository.ProductPrimaryImage::getImageUrl, (first, ignored) -> first));
        return items.stream().map(item -> response(item, imageUrls.get(item.getProduct().getId()))).toList();
    }

    @Transactional
    public WishListItemResponse add(Long customerId, Long productId) {
        WishListItem item = wishListRepository.findByCustomerIdAndProductId(customerId, productId)
                .orElseGet(() -> {
                    Product product = productRepository.findByIdAndActiveTrue(productId)
                            .filter(value -> value.getCategory() == null || value.getCategory().isActive())
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
                    return wishListRepository.save(WishListItem.builder()
                            .customer(customerRepository.getReferenceById(customerId))
                            .product(product).build());
                });
        String imageUrl = productImageRepository.findPrimaryImagesByProductIds(List.of(productId)).stream()
                .findFirst().map(ProductImageRepository.ProductPrimaryImage::getImageUrl).orElse(null);
        return response(item, imageUrl);
    }

    @Transactional
    public void remove(Long customerId, Long productId) {
        WishListItem item = wishListRepository.findByCustomerIdAndProductId(customerId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist item not found"));
        wishListRepository.delete(item);
    }

    private WishListItemResponse response(WishListItem item, String imageUrl) {
        Product product = item.getProduct();
        return new WishListItemResponse(item.getId(), product.getId(), product.getName(),
                product.getType(), imageUrl, product.getBasePrice(), item.getAddedAt());
    }
}
