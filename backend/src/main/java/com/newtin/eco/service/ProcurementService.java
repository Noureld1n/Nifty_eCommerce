package com.newtin.eco.service;

import com.newtin.eco.dto.request.AccountableRequest;
import com.newtin.eco.dto.request.ProcurementLineRequest;
import com.newtin.eco.dto.request.ProcurementPackageRequest;
import com.newtin.eco.dto.request.ProviderRequest;
import com.newtin.eco.dto.response.AccountableResponse;
import com.newtin.eco.dto.response.ProcurementPackageResponse;
import com.newtin.eco.dto.response.ProviderResponse;
import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.*;
import com.newtin.eco.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProcurementService {
    private final ProviderRepository providerRepository;
    private final AccountableRepository accountableRepository;
    private final ProcurementPackageRepository packageRepository;
    private final VariantItemRepository variantItemRepository;
    private final AdminActionLogService actionLogService;

    @Transactional(readOnly = true)
    public List<ProviderResponse> providers(Boolean active) {
        List<Provider> providers = active == null ? providerRepository.findAll()
                : providerRepository.findByActiveOrderByNameAsc(active);
        return providers.stream().sorted(java.util.Comparator.comparing(Provider::getName, String.CASE_INSENSITIVE_ORDER))
                .map(ProviderResponse::from).toList();
    }

    @Transactional
    public ProviderResponse createProvider(Long adminId, ProviderRequest request) {
        Provider provider = providerRepository.save(Provider.builder().name(request.name().trim())
                .email(trimToNull(request.email())).phone(trimToNull(request.phone())).build());
        actionLogService.log(adminId, AdminActionType.PROVIDER_CREATED, AuditEntityType.PROVIDER,
                provider.getId(), "Procurement provider created", null, Map.of("name", provider.getName()));
        return ProviderResponse.from(provider);
    }

    @Transactional
    public ProviderResponse updateProvider(Long adminId, Long id, ProviderRequest request) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
        provider.setName(request.name().trim());
        provider.setEmail(trimToNull(request.email()));
        provider.setPhone(trimToNull(request.phone()));
        actionLogService.log(adminId, AdminActionType.PROVIDER_UPDATED, AuditEntityType.PROVIDER,
                id, "Procurement provider updated", null, Map.of("name", provider.getName()));
        return ProviderResponse.from(provider);
    }

    @Transactional
    public ProviderResponse setProviderActive(Long adminId, Long id, boolean active) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
        if (provider.isActive() == active) return ProviderResponse.from(provider);
        provider.setActive(active);
        actionLogService.log(adminId,
                active ? AdminActionType.PROVIDER_ACTIVATED : AdminActionType.PROVIDER_DEACTIVATED,
                AuditEntityType.PROVIDER, id, active ? "Procurement provider activated" : "Procurement provider deactivated",
                null, Map.of("active", active));
        return ProviderResponse.from(provider);
    }

    @Transactional(readOnly = true)
    public List<AccountableResponse> accountables(Boolean active) {
        List<Accountable> accountables = active == null ? accountableRepository.findAll()
                : accountableRepository.findByActiveOrderByNameAsc(active);
        return accountables.stream()
                .sorted(java.util.Comparator.comparing(Accountable::getName, String.CASE_INSENSITIVE_ORDER))
                .map(AccountableResponse::from).toList();
    }

    @Transactional
    public AccountableResponse createAccountable(Long adminId, AccountableRequest request) {
        Accountable accountable = accountableRepository.save(Accountable.builder().name(request.name().trim())
                .email(trimToNull(request.email())).phone(trimToNull(request.phone())).build());
        actionLogService.log(adminId, AdminActionType.ACCOUNTABLE_CREATED, AuditEntityType.ACCOUNTABLE,
                accountable.getId(), "Procurement accountable created", null, Map.of("name", accountable.getName()));
        return AccountableResponse.from(accountable);
    }

    @Transactional
    public AccountableResponse updateAccountable(Long adminId, Long id, AccountableRequest request) {
        Accountable accountable = accountableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accountable not found"));
        accountable.setName(request.name().trim());
        accountable.setEmail(trimToNull(request.email()));
        accountable.setPhone(trimToNull(request.phone()));
        actionLogService.log(adminId, AdminActionType.ACCOUNTABLE_UPDATED, AuditEntityType.ACCOUNTABLE,
                id, "Procurement accountable updated", null, Map.of("name", accountable.getName()));
        return AccountableResponse.from(accountable);
    }

    @Transactional
    public AccountableResponse setAccountableActive(Long adminId, Long id, boolean active) {
        Accountable accountable = accountableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accountable not found"));
        if (accountable.isActive() == active) return AccountableResponse.from(accountable);
        accountable.setActive(active);
        actionLogService.log(adminId,
                active ? AdminActionType.ACCOUNTABLE_ACTIVATED : AdminActionType.ACCOUNTABLE_DEACTIVATED,
                AuditEntityType.ACCOUNTABLE, id,
                active ? "Procurement accountable activated" : "Procurement accountable deactivated",
                null, Map.of("active", active));
        return AccountableResponse.from(accountable);
    }

    @Transactional(readOnly = true)
    public Page<ProcurementPackageResponse> listPackages(Pageable pageable) {
        return packageRepository.findAllByOrderByPurchaseDateDescIdDesc(pageable)
                .map(ProcurementPackageResponse::from);
    }

    @Transactional(readOnly = true)
    public ProcurementPackageResponse getPackage(Long id) {
        ProcurementPackage procurementPackage = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Procurement package not found"));
        return ProcurementPackageResponse.from(procurementPackage);
    }

    @Transactional
    public ProcurementPackageResponse receive(Long adminId, ProcurementPackageRequest request) {
        Provider provider = providerRepository.findById(request.providerId())
                .filter(Provider::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active provider not found"));
        Accountable accountable = accountableRepository.findById(request.accountableId())
                .filter(Accountable::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active accountable not found"));
        Set<Long> variantIds = new HashSet<>();
        Map<Long, VariantItem> variants = new HashMap<>();
        BigDecimal totalCost = BigDecimal.ZERO;
        for (ProcurementLineRequest line : request.items()) {
            if (!variantIds.add(line.variantItemId()))
                throw new BadRequestException("Each variant can appear only once in a procurement package");
            VariantItem variant = variantItemRepository.findByIdForUpdate(line.variantItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
            if (!variant.isActive()) throw new ConflictException("Cannot receive stock for an inactive variant");
            if ((long) variant.getStockQuantity() + line.quantity() > Integer.MAX_VALUE)
                throw new ConflictException("Received quantity exceeds supported stock capacity");
            variants.put(line.variantItemId(), variant);
            totalCost = totalCost.add(line.unitCost().multiply(BigDecimal.valueOf(line.quantity())));
        }

        ProcurementPackage procurementPackage = ProcurementPackage.builder()
                .provider(provider).accountable(accountable).totalCost(totalCost)
                .purchaseDate(request.purchaseDate() == null ? LocalDateTime.now() : request.purchaseDate())
                .referenceNumber(trimToNull(request.referenceNumber()))
                .notes(trimToNull(request.notes())).build();

        for (ProcurementLineRequest line : request.items()) {
            VariantItem variant = variants.get(line.variantItemId());
            variant.setStockQuantity(variant.getStockQuantity() + line.quantity());
            procurementPackage.getItems().add(ProcurementPackageItem.builder()
                    .procurementPackage(procurementPackage).variantItem(variant)
                    .quantity(line.quantity()).unitCost(line.unitCost())
                    .notes(trimToNull(line.notes())).build());
        }

        packageRepository.saveAndFlush(procurementPackage);
        actionLogService.log(adminId, AdminActionType.PROCUREMENT_RECORDED, AuditEntityType.PROCUREMENT_PACKAGE,
                procurementPackage.getId(), "Procurement received and stock updated",
                null, Map.of("totalCost", totalCost, "lineCount", procurementPackage.getItems().size()));
        return ProcurementPackageResponse.from(procurementPackage);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
