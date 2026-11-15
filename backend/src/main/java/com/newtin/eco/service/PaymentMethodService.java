package com.newtin.eco.service;

import com.newtin.eco.dto.request.AddPaymentMethodRequest;
import com.newtin.eco.dto.response.PaymentMethodResponse;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.PaymentMethod;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {
    private static final int MAX_ACTIVE = 10;

    private final PaymentMethodRepository repository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> list(Long customerId) {
        return repository.findActiveByCustomer(customerId).stream()
                .map(PaymentMethodResponse::from).toList();
    }

    @Transactional
    public PaymentMethodResponse add(Long customerId, AddPaymentMethodRequest req) {
        validateExpiry(req.expiryMonth(), req.expiryYear());
        String token = req.providerToken().trim();

        long activeCount = repository.countByCustomerIdAndActiveTrue(customerId);
        if (activeCount >= MAX_ACTIVE)
            throw new BadRequestException("You can save at most " + MAX_ACTIVE + " payment methods");

        PaymentMethod pm = repository.findByProviderAndProviderToken(req.provider(), token).orElse(null);
        if (pm != null) {
            if (!pm.getCustomer().getId().equals(customerId))
                throw new ConflictException("This payment method cannot be added");   // don't reveal the owner
            if (pm.isActive())
                throw new ConflictException("This payment method is already saved");
            // previously removed by this same customer: bring the row back instead of violating the unique key
            pm.setActive(true);
            pm.setDefaultMethod(false);
            pm.setCardBrand(req.cardBrand());
            pm.setLast4(req.last4());
            pm.setExpiryMonth(req.expiryMonth());
            pm.setExpiryYear(req.expiryYear());
        } else {
            pm = PaymentMethod.builder()
                    .customer(customerRepository.getReferenceById(customerId))
                    .provider(req.provider())
                    .providerToken(token)
                    .cardBrand(req.cardBrand())
                    .last4(req.last4())
                    .expiryMonth(req.expiryMonth())
                    .expiryYear(req.expiryYear())
                    .build();
        }
        pm = repository.saveAndFlush(pm);

        // the first method is always the default
        if (Boolean.TRUE.equals(req.makeDefault()) || activeCount == 0) {
            repository.clearDefault(customerId);
            repository.markDefault(pm.getId());
        }
        return PaymentMethodResponse.from(repository.findById(pm.getId()).orElseThrow());
    }

    @Transactional
    public PaymentMethodResponse setDefault(Long customerId, Long id) {
        PaymentMethod pm = findOwned(customerId, id);
        if (!pm.isDefaultMethod()) {
            repository.clearDefault(customerId);
            repository.markDefault(id);
        }
        return PaymentMethodResponse.from(repository.findById(id).orElseThrow());
    }

    /** Soft delete: the row stays for history, but stops being usable or listed. */
    @Transactional
    public void remove(Long customerId, Long id) {
        PaymentMethod pm = findOwned(customerId, id);
        boolean wasDefault = pm.isDefaultMethod();
        pm.setActive(false);
        pm.setDefaultMethod(false);
        repository.saveAndFlush(pm);

        if (wasDefault) {   // never leave a customer with methods but no default
            repository.findFirstByCustomerIdAndActiveTrueOrderByCreatedAtDescIdDesc(customerId)
                    .ifPresent(next -> repository.markDefault(next.getId()));
        }
    }

    private PaymentMethod findOwned(Long customerId, Long id) {
        return repository.findByIdAndCustomerIdAndActiveTrue(id, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment method not found"));
    }

    private void validateExpiry(Integer month, Integer year) {
        if ((month == null) != (year == null))
            throw new BadRequestException("Provide both expiry month and expiry year");
        if (month != null && YearMonth.of(year, month).isBefore(YearMonth.now()))
            throw new BadRequestException("This card has expired");
    }
}