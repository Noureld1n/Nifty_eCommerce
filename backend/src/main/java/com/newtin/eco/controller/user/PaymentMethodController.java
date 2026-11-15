package com.newtin.eco.controller.user;

import com.newtin.eco.dto.request.AddPaymentMethodRequest;
import com.newtin.eco.dto.response.PaymentMethodResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/user/payment-methods")
@RequiredArgsConstructor
public class PaymentMethodController {
    private final PaymentMethodService service;

    @GetMapping
    public List<PaymentMethodResponse> list(@AuthenticationPrincipal CustomUserDetails principal) {
        return service.list(principal.getId());
    }

    @PostMapping
    public ResponseEntity<PaymentMethodResponse> add(@AuthenticationPrincipal CustomUserDetails principal,
                                                     @Valid @RequestBody AddPaymentMethodRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.add(principal.getId(), req));
    }

    @PutMapping("/{id}/default")
    public PaymentMethodResponse setDefault(@AuthenticationPrincipal CustomUserDetails principal,
                                            @PathVariable Long id) {
        return service.setDefault(principal.getId(), id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable Long id) {
        service.remove(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}