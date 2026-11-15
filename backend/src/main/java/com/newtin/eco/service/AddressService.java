package com.newtin.eco.service;

import com.newtin.eco.dto.request.AddressRequest;
import com.newtin.eco.dto.response.AddressResponse;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.Address;
import com.newtin.eco.repository.AddressRepository;
import com.newtin.eco.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AddressService {
    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public List<AddressResponse> list(Long customerId) {
        return addressRepository.findByCustomerIdOrderByDefaultAddressDescCreatedAtDescIdDesc(customerId)
                .stream().map(AddressResponse::from).toList();
    }

    @Transactional
    public AddressResponse create(Long customerId, AddressRequest request) {
        boolean makeDefault = requestDefaultOnCreate(customerId);
        if (makeDefault) addressRepository.clearDefault(customerId);

        Address address = Address.builder()
                .customer(customerRepository.getReferenceById(customerId))
                .street(request.street().trim())
                .city(request.city().trim())
                .state(trimToNull(request.state()))
                .zipcode(trimToNull(request.zipcode()))
                .countryCode(countryCode(request.countryCode()))
                .addressType(request.addressType())
                .defaultAddress(makeDefault)
                .build();
        return AddressResponse.from(addressRepository.saveAndFlush(address));
    }

    @Transactional
    public AddressResponse update(Long customerId, Long addressId, AddressRequest request) {
        Address address = findOwned(customerId, addressId);
        address.setStreet(request.street().trim());
        address.setCity(request.city().trim());
        address.setState(trimToNull(request.state()));
        address.setZipcode(trimToNull(request.zipcode()));
        address.setCountryCode(countryCode(request.countryCode()));
        address.setAddressType(request.addressType());
        return AddressResponse.from(address);
    }

    @Transactional
    public AddressResponse setDefault(Long customerId, Long addressId) {
        Address address = findOwned(customerId, addressId);
        if (!address.isDefaultAddress()) {
            addressRepository.clearDefault(customerId);
            address.setDefaultAddress(true);
            addressRepository.saveAndFlush(address);
        }
        return AddressResponse.from(address);
    }

    @Transactional
    public void delete(Long customerId, Long addressId) {
        Address address = findOwned(customerId, addressId);
        boolean wasDefault = address.isDefaultAddress();
        addressRepository.delete(address);

        if (wasDefault) {
            addressRepository.findFirstByCustomerIdOrderByCreatedAtDescIdDesc(customerId)
                    .ifPresent(next -> {
                        next.setDefaultAddress(true);
                        addressRepository.save(next);
                    });
        }
    }

    private boolean requestDefaultOnCreate(Long customerId) {
        return !addressRepository.existsByCustomerIdAndDefaultAddressTrue(customerId);
    }

    private Address findOwned(Long customerId, Long addressId) {
        return addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
    }

    private String countryCode(String countryCode) {
        return countryCode == null || countryCode.isBlank()
                ? "EG" : countryCode.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
