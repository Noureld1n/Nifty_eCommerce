package com.newtin.eco.controller.user;

import com.newtin.eco.dto.response.WishListItemResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.WishListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/wishlist")
@RequiredArgsConstructor
public class WishListController {
    private final WishListService wishListService;

    @GetMapping
    public List<WishListItemResponse> list(@AuthenticationPrincipal CustomUserDetails principal) {
        return wishListService.listMine(principal.getId());
    }

    @PostMapping("/{productId}")
    public ResponseEntity<WishListItemResponse> add(@AuthenticationPrincipal CustomUserDetails principal,
                                                    @PathVariable Long productId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(wishListService.add(principal.getId(), productId));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable Long productId) {
        wishListService.remove(principal.getId(), productId);
        return ResponseEntity.noContent().build();
    }
}
