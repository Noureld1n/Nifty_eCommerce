package com.newtin.eco.dto.response;

import com.newtin.eco.enums.AddressType;
import com.newtin.eco.model.Address;

import java.time.LocalDateTime;

public record AddressResponse(
        Long id,
        String street,
        String city,
        String state,
        String zipcode,
        String countryCode,
        AddressType addressType,
        boolean defaultAddress,
        LocalDateTime createdAt
) {
    public static AddressResponse from(Address address) {
        return new AddressResponse(address.getId(), address.getStreet(), address.getCity(),
                address.getState(), address.getZipcode(), address.getCountryCode(),
                address.getAddressType(), address.isDefaultAddress(), address.getCreatedAt());
    }
}
