package com.newtin.eco.model;

import java.io.Serializable;
import java.util.Objects;

public class CartItemId implements Serializable {
    private Long cart;
    private Long variantItem;

    public CartItemId() {}

    public CartItemId(Long cart, Long variantItem) {
        this.cart = cart;
        this.variantItem = variantItem;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof CartItemId that)) return false;
        return Objects.equals(cart, that.cart) && Objects.equals(variantItem, that.variantItem);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cart, variantItem);
    }
}
