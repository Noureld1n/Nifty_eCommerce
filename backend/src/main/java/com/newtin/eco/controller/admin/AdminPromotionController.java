package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.request.PromotionRequest;
import com.newtin.eco.dto.request.UpdateStatusRequest;
import com.newtin.eco.dto.response.PromotionResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.PromotionService;
import com.newtin.eco.util.Pages;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
public class AdminPromotionController {
    private final PromotionService promotionService;

    @GetMapping
    public PagedModel<PromotionResponse> list(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(promotionService.listAdmin(Pages.of(page, size)));
    }

    @GetMapping("/{id}")
    public PromotionResponse get(@PathVariable Long id) {
        return promotionService.getAdmin(id);
    }

    @PostMapping
    public PromotionResponse create(@AuthenticationPrincipal CustomUserDetails admin,
                                    @Valid @RequestBody PromotionRequest request) {
        return promotionService.create(admin.getId(), request);
    }

    @PutMapping("/{id}")
    public PromotionResponse update(@AuthenticationPrincipal CustomUserDetails admin,
                                    @PathVariable Long id,
                                    @Valid @RequestBody PromotionRequest request) {
        return promotionService.update(admin.getId(), id, request);
    }

    @PatchMapping("/{id}/status")
    public PromotionResponse setStatus(@AuthenticationPrincipal CustomUserDetails admin,
                                       @PathVariable Long id,
                                       @Valid @RequestBody UpdateStatusRequest request) {
        return promotionService.setActive(admin.getId(), id, request.active());
    }
}
