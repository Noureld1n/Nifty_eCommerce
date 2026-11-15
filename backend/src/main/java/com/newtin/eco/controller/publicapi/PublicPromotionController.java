package com.newtin.eco.controller.publicapi;

import com.newtin.eco.dto.response.PromotionResponse;
import com.newtin.eco.service.PromotionService;
import com.newtin.eco.util.Pages;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/promotions")
@RequiredArgsConstructor
public class PublicPromotionController {
    private final PromotionService promotionService;

    @GetMapping
    public PagedModel<PromotionResponse> list(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(promotionService.listCurrent(Pages.of(page, size)));
    }
}
