package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.request.UpdateOrderStatusRequest;
import com.newtin.eco.dto.request.UpdatePaymentStatusRequest;
import com.newtin.eco.dto.request.UpdateShipmentRequest;
import com.newtin.eco.dto.response.OrderResponse;
import com.newtin.eco.dto.response.ShipmentResponse;
import com.newtin.eco.enums.OrderStatus;
import com.newtin.eco.enums.PaymentStatus;
import com.newtin.eco.service.OrderService;
import com.newtin.eco.util.Pages;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final OrderService orderService;

    @GetMapping
    public PagedModel<OrderResponse> list(@RequestParam(required = false) OrderStatus status,
                                          @RequestParam(required = false) PaymentStatus paymentStatus,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(orderService.listAll(status, paymentStatus, Pages.of(page, size)));
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.getAny(id);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse setStatus(@PathVariable Long id,
                                  @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.setOrderStatus(id, request.status());
    }

    @PatchMapping("/{id}/payment-status")
    public OrderResponse setPaymentStatus(@PathVariable Long id,
                                          @Valid @RequestBody UpdatePaymentStatusRequest request) {
        return orderService.setPaymentStatus(id, request.status());
    }

    @PutMapping("/{id}/shipment")
    public OrderResponse updateShipment(@PathVariable Long id,
                                        @Valid @RequestBody UpdateShipmentRequest request) {
        return orderService.updateShipment(id, request);
    }

    @GetMapping("/{id}/shipment")
    public ResponseEntity<ShipmentResponse> shipment(@PathVariable Long id) {
        ShipmentResponse response = orderService.getShipment(null, id, true);
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }
}
