package com.newtin.eco.controller.user;

import com.newtin.eco.dto.request.AddressRequest;
import com.newtin.eco.dto.response.AddressResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final AddressService addressService;

    @GetMapping
    public List<AddressResponse> list(@AuthenticationPrincipal CustomUserDetails principal) {
        return addressService.list(principal.getId());
    }

    @PostMapping
    public ResponseEntity<AddressResponse> create(@AuthenticationPrincipal CustomUserDetails principal,
                                                  @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(addressService.create(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public AddressResponse update(@AuthenticationPrincipal CustomUserDetails principal,
                                  @PathVariable Long id,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.update(principal.getId(), id, request);
    }

    @PutMapping("/{id}/default")
    public AddressResponse setDefault(@AuthenticationPrincipal CustomUserDetails principal,
                                      @PathVariable Long id) {
        return addressService.setDefault(principal.getId(), id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable Long id) {
        addressService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
