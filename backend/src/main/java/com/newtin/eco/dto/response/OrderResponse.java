package com.newtin.eco.dto.response;

import com.newtin.eco.enums.OrderStatus;
import com.newtin.eco.enums.PaymentStatus;
import com.newtin.eco.model.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerEmail,
        BigDecimal totalPrice,
        LocalDateTime createdAt,
        OrderStatus status,
        PaymentStatus paymentStatus,
        String currencyCode,
        AddressResponse shippingAddress,
        AddressResponse billingAddress,
        List<OrderItemResponse> items,
        ShipmentResponse shipment
) {
    public static OrderResponse from(Order order) {
        var user = order.getCustomer().getUser();
        return new OrderResponse(order.getId(), order.getCustomer().getId(),
                user.getFirstName() + " " + user.getLastName(), user.getEmail(),
                order.getTotalPrice(), order.getCreatedAt(), order.getStatus(),
                order.getPaymentStatus(), order.getCurrencyCode(),
                order.getShippingAddress() == null ? null : AddressResponse.from(order.getShippingAddress()),
                order.getBillingAddress() == null ? null : AddressResponse.from(order.getBillingAddress()),
                order.getItems().stream().map(OrderItemResponse::from).toList(),
                ShipmentResponse.from(order.getShipment()));
    }
}
