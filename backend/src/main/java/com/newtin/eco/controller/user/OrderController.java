package com.newtin.eco.controller.user;

import com.newtin.eco.dto.request.CreateOrderRequest;
import com.newtin.eco.dto.response.OrderResponse;
import com.newtin.eco.dto.response.ShipmentResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.OrderService;
import com.newtin.eco.util.Pages;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@AuthenticationPrincipal CustomUserDetails principal,
                                                @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.create(principal.getId(), request));
    }

    @GetMapping
    public PagedModel<OrderResponse> list(@AuthenticationPrincipal CustomUserDetails principal,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = Pages.of(page, size);
        return new PagedModel<>(orderService.listMine(principal.getId(), pageable));
    }

    @GetMapping("/{id}")
    public OrderResponse get(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long id) {
        return orderService.getMine(principal.getId(), id);
    }

    @GetMapping("/{id}/shipment")
    public ResponseEntity<ShipmentResponse> shipment(@AuthenticationPrincipal CustomUserDetails principal,
                                                     @PathVariable Long id) {
        ShipmentResponse response = orderService.getShipment(principal.getId(), id, false);
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    public OrderResponse cancel(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long id) {
        return orderService.cancelMine(principal.getId(), id);
    }
}
