package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.request.AccountableRequest;
import com.newtin.eco.dto.request.ProcurementPackageRequest;
import com.newtin.eco.dto.request.ProviderRequest;
import com.newtin.eco.dto.request.UpdateStatusRequest;
import com.newtin.eco.dto.response.AccountableResponse;
import com.newtin.eco.dto.response.ProcurementPackageResponse;
import com.newtin.eco.dto.response.ProviderResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.ProcurementService;
import com.newtin.eco.util.Pages;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/procurement")
@RequiredArgsConstructor
public class AdminProcurementController {
    private final ProcurementService procurementService;

    @GetMapping("/providers")
    public List<ProviderResponse> providers(@RequestParam(required = false) Boolean active) {
        return procurementService.providers(active);
    }

    @PostMapping("/providers")
    public ResponseEntity<ProviderResponse> createProvider(@AuthenticationPrincipal CustomUserDetails admin,
                                                           @Valid @RequestBody ProviderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.createProvider(admin.getId(), request));
    }

    @PutMapping("/providers/{id}")
    public ProviderResponse updateProvider(@AuthenticationPrincipal CustomUserDetails admin,
                                           @PathVariable Long id,
                                           @Valid @RequestBody ProviderRequest request) {
        return procurementService.updateProvider(admin.getId(), id, request);
    }

    @PatchMapping("/providers/{id}/status")
    public ProviderResponse setProviderStatus(@AuthenticationPrincipal CustomUserDetails admin,
                                              @PathVariable Long id,
                                              @Valid @RequestBody UpdateStatusRequest request) {
        return procurementService.setProviderActive(admin.getId(), id, request.active());
    }

    @GetMapping("/accountables")
    public List<AccountableResponse> accountables(@RequestParam(required = false) Boolean active) {
        return procurementService.accountables(active);
    }

    @PostMapping("/accountables")
    public ResponseEntity<AccountableResponse> createAccountable(
            @AuthenticationPrincipal CustomUserDetails admin,
            @Valid @RequestBody AccountableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.createAccountable(admin.getId(), request));
    }

    @PutMapping("/accountables/{id}")
    public AccountableResponse updateAccountable(@AuthenticationPrincipal CustomUserDetails admin,
                                                 @PathVariable Long id,
                                                 @Valid @RequestBody AccountableRequest request) {
        return procurementService.updateAccountable(admin.getId(), id, request);
    }

    @PatchMapping("/accountables/{id}/status")
    public AccountableResponse setAccountableStatus(@AuthenticationPrincipal CustomUserDetails admin,
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody UpdateStatusRequest request) {
        return procurementService.setAccountableActive(admin.getId(), id, request.active());
    }

    @GetMapping("/packages")
    public PagedModel<ProcurementPackageResponse> packages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(procurementService.listPackages(Pages.of(page, size)));
    }

    @GetMapping("/packages/{id}")
    public ProcurementPackageResponse getPackage(@PathVariable Long id) {
        return procurementService.getPackage(id);
    }

    @PostMapping("/packages")
    public ResponseEntity<ProcurementPackageResponse> receive(@AuthenticationPrincipal CustomUserDetails admin,
                                                              @Valid @RequestBody ProcurementPackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(procurementService.receive(admin.getId(), request));
    }
}
