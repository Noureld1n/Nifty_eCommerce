package com.newtin.eco.controller.user;

import com.newtin.eco.dto.request.CartCheckoutRequest;
import com.newtin.eco.dto.request.CartItemRequest;
import com.newtin.eco.dto.request.UpdateCartItemRequest;
import com.newtin.eco.dto.response.CartResponse;
import com.newtin.eco.dto.response.OrderResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public CartResponse get(@AuthenticationPrincipal CustomUserDetails principal) {
        return cartService.getActive(principal.getId());
    }

    @PostMapping("/items")
    public CartResponse add(@AuthenticationPrincipal CustomUserDetails principal,
                            @Valid @RequestBody CartItemRequest request) {
        return cartService.add(principal.getId(), request);
    }

    @PutMapping("/items/{variantItemId}")
    public CartResponse setQuantity(@AuthenticationPrincipal CustomUserDetails principal,
                                   @PathVariable Long variantItemId,
                                   @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.setQuantity(principal.getId(), variantItemId, request);
    }

    @DeleteMapping
    public ResponseEntity<Void> abandon(@AuthenticationPrincipal CustomUserDetails principal) {
        cartService.abandon(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/items/{variantItemId}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable Long variantItemId) {
        cartService.remove(principal.getId(), variantItemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@AuthenticationPrincipal CustomUserDetails principal,
                                                  @Valid @RequestBody CartCheckoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cartService.checkout(principal.getId(), request));
    }
}
