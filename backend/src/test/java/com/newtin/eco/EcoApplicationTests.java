package com.newtin.eco;

import com.newtin.eco.repository.OrderCatalogRepository;
import com.newtin.eco.repository.AdminAnalyticsRepository;
import com.newtin.eco.repository.ProductRepository;
import com.newtin.eco.repository.CategoryRepository;
import com.newtin.eco.repository.OrderCatalogRepository.VariantOrderDetails;
import com.newtin.eco.dto.request.ProductImageRequest;
import com.newtin.eco.dto.request.CreateProductRequest;
import com.newtin.eco.dto.request.VariantRequest;
import com.newtin.eco.dto.request.ProviderRequest;
import com.newtin.eco.dto.request.AccountableRequest;
import com.newtin.eco.dto.request.ProcurementLineRequest;
import com.newtin.eco.dto.request.ProcurementPackageRequest;
import com.newtin.eco.dto.request.PromotionRequest;
import com.newtin.eco.dto.request.CreateOrderRequest;
import com.newtin.eco.dto.request.CartItemRequest;
import com.newtin.eco.dto.request.UpdateCartItemRequest;
import com.newtin.eco.dto.request.ProductReviewRequest;
import com.newtin.eco.dto.request.OrderLineRequest;
import com.newtin.eco.enums.AddressType;
import com.newtin.eco.enums.AnalyticsRange;
import com.newtin.eco.enums.ProductType;
import com.newtin.eco.enums.DiscountType;
import com.newtin.eco.enums.Role;
import com.newtin.eco.model.Address;
import com.newtin.eco.model.Category;
import com.newtin.eco.model.Customer;
import com.newtin.eco.model.User;
import com.newtin.eco.repository.AddressRepository;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.UserRepository;
import com.newtin.eco.repository.ShoppingCartRepository;
import com.newtin.eco.service.ProductService;
import com.newtin.eco.service.ProductImageService;
import com.newtin.eco.service.ProcurementService;
import com.newtin.eco.service.PromotionService;
import com.newtin.eco.service.OrderService;
import com.newtin.eco.service.CartService;
import com.newtin.eco.service.WishListService;
import com.newtin.eco.service.ProductReviewService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.mock.web.MockHttpServletRequest;

import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@SpringBootTest
class EcoApplicationTests {
	@Autowired
	private OrderCatalogRepository orderCatalogRepository;

	@Autowired
	private AdminAnalyticsRepository adminAnalyticsRepository;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private CategoryRepository categoryRepository;

	@Autowired
	private ProductService productService;

	@Autowired
	private ProductImageService productImageService;

	@Autowired
	private ProcurementService procurementService;

	@Autowired
	private PromotionService promotionService;

	@Autowired
	private OrderService orderService;

	@Autowired
	private CartService cartService;

	@Autowired
	private WishListService wishListService;

	@Autowired
	private ProductReviewService productReviewService;

	@Autowired
	private ShoppingCartRepository shoppingCartRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private AddressRepository addressRepository;

	@Autowired
	@Qualifier("corsSource")
	private CorsConfigurationSource corsConfigurationSource;

	@Test
	void contextLoads() {
	}

	@Test
	void corsAllowsExpoWebDevelopmentOrigins() {
		var request = new MockHttpServletRequest();
		request.setRequestURI("/api/public/auth/refresh");
		CorsConfiguration cors = corsConfigurationSource.getCorsConfiguration(request);

		Assertions.assertNotNull(cors);
		Assertions.assertEquals("http://localhost:8081",
				cors.checkOrigin("http://localhost:8081"));
		Assertions.assertEquals("http://127.0.0.1:8081",
				cors.checkOrigin("http://127.0.0.1:8081"));
		Assertions.assertNull(cors.checkOrigin("http://localhost:8082"));
	}

	@Test
	void orderCatalogLookupHandlesUnknownVariant() {
		Assertions.assertTrue(orderCatalogRepository.findOrderDetails(java.util.List.of(0L)).isEmpty());
	}

	@Test
	void publicCatalogQueriesWorkAgainstSchema() {
		Assertions.assertNotNull(productRepository.findPublic(null, null,
				org.springframework.data.domain.PageRequest.of(0, 5)));
		Assertions.assertNotNull(productRepository.searchAdmin(null, null, null,
				org.springframework.data.domain.PageRequest.of(0, 5)));
		Assertions.assertNotNull(categoryRepository.findByActiveTrueOrderByNameAsc());
	}

	@Test
	void analyticsChartSupportsDayMonthAndYearRanges() {
		var day = adminAnalyticsRepository.dashboard(AnalyticsRange.DAY, 0);
		var month = adminAnalyticsRepository.dashboard(AnalyticsRange.MONTH, 0);
		var year = adminAnalyticsRepository.dashboard(AnalyticsRange.YEAR, 0);
		var previousDay = adminAnalyticsRepository.dashboard(AnalyticsRange.DAY, 1);
		var previousMonth = adminAnalyticsRepository.dashboard(AnalyticsRange.MONTH, 1);
		var previousYear = adminAnalyticsRepository.dashboard(AnalyticsRange.YEAR, 1);

		Assertions.assertEquals("DAY", day.salesRange());
		Assertions.assertEquals(24, day.salesAndPurchasing().size());
		Assertions.assertEquals(LocalDateTime.now().truncatedTo(ChronoUnit.HOURS).minusHours(23)
				.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00")),
				day.salesAndPurchasing().getFirst().period());
		Assertions.assertEquals(LocalDateTime.now().minusDays(1).truncatedTo(ChronoUnit.HOURS).minusHours(23)
				.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00")),
				previousDay.salesAndPurchasing().getFirst().period());

		Assertions.assertEquals("MONTH", month.salesRange());
		Assertions.assertEquals(30, month.salesAndPurchasing().size());
		Assertions.assertEquals(LocalDate.now().minusDays(29).toString(),
				month.salesAndPurchasing().getFirst().period());
		Assertions.assertEquals(LocalDate.now().minusDays(59).toString(),
				previousMonth.salesAndPurchasing().getFirst().period());

		Assertions.assertEquals("YEAR", year.salesRange());
		Assertions.assertEquals(12, year.salesAndPurchasing().size());
		Assertions.assertEquals(YearMonth.now().minusMonths(11).toString(),
				year.salesAndPurchasing().getFirst().period());
		Assertions.assertEquals(YearMonth.now().minusMonths(23).toString(),
				previousYear.salesAndPurchasing().getFirst().period());
	}

	@Test
	@Transactional
	void productVariantImageAndProcurementCycleWorks() {
		var category = categoryRepository.saveAndFlush(Category.builder().name("Test category").build());
		var product = productService.create(null, new CreateProductRequest(ProductType.CLOTHING, category.getId(),
				"Test catalog item", new BigDecimal("25.00"), "Test description", null,
				"Test clothing", null, null, "Cotton", null,
				List.of(new VariantRequest("S", "Green", null, null, null, null,
						BigDecimal.ZERO, "Initial test variant", false))));
		Assertions.assertEquals("Test clothing", product.typeDetails().get("clothingType"));
		Assertions.assertEquals(1, product.variants().size());

		var accessory = productService.create(null, new CreateProductRequest(ProductType.ACCESSORY, null,
				"Test accessory", new BigDecimal("15.00"), null, null,
				null, "Test bag", null, "Leather", null,
				List.of(new VariantRequest(null, "Black", "Leather", null, null, null,
						BigDecimal.ZERO, null, false))));
		Assertions.assertEquals(1, accessory.variants().size());

		var skincare = productService.create(null, new CreateProductRequest(ProductType.SKINCARE, null,
				"Test skincare", new BigDecimal("10.00"), null, null,
				null, null, "Moisturizer", null, "All",
				List.of(new VariantRequest(null, null, null, new BigDecimal("50.00"), "50ml",
						"Cream", BigDecimal.ZERO, null, false))));
		Assertions.assertEquals(1, skincare.variants().size());

		var variant = productService.addVariant(null, product.id(),
				new VariantRequest("M", "Blue", null, null, null, null,
						new BigDecimal("2.50"), "Test variant", false));
		Assertions.assertEquals(0, variant.stockQuantity());
		VariantOrderDetails orderDetails = orderCatalogRepository.findOrderDetails(
				List.of(variant.variantItemId())).getFirst();
		Assertions.assertEquals(new BigDecimal("27.50"), orderDetails.getUnitPrice());

		var promotion = promotionService.create(null, new PromotionRequest(
				"Test discount", "Test promotion", DiscountType.PERCENTAGE, new BigDecimal("10.00"),
				LocalDateTime.now().minusHours(1), LocalDateTime.now().plusHours(1),
				java.util.Set.of(category.getId()), java.util.Set.of()));
		Assertions.assertTrue(promotion.currentlyEffective());
		Assertions.assertEquals(new BigDecimal("24.75"),
				productService.getPublic(product.id()).variants().stream()
						.filter(item -> item.variantItemId().equals(variant.variantItemId()))
						.findFirst().orElseThrow().currentPrice());
		Assertions.assertTrue(promotionService.listCurrent(
				org.springframework.data.domain.PageRequest.of(0, 100))
				.getContent().stream().anyMatch(item -> item.id().equals(promotion.id())));

		var image = productImageService.create(null, product.id(), variant.variantItemId(),
				new ProductImageRequest("https://example.test/item.jpg", "Test item", 0, null));
		Assertions.assertTrue(image.main());
		var secondImage = productImageService.create(null, product.id(), variant.variantItemId(),
				new ProductImageRequest("https://example.test/item-2.jpg", "Second test item", 1, false));
		Assertions.assertFalse(secondImage.main());
		productImageService.delete(null, product.id(), variant.variantItemId(), image.id());
		Assertions.assertTrue(productImageService.list(product.id(), variant.variantItemId()).getFirst().main());
		Assertions.assertEquals(2, productService.getPublic(product.id()).variants().size());

		var provider = procurementService.createProvider(null,
				new ProviderRequest("Test supplier", null, null));
		var accountable = procurementService.createAccountable(null,
				new AccountableRequest("Test receiver", null, null));
		var received = procurementService.receive(null, new ProcurementPackageRequest(
				provider.id(), accountable.id(), null, null, "Rollback-only test receipt",
				List.of(new ProcurementLineRequest(variant.variantItemId(), 4,
						new BigDecimal("3.00"), null))));

		Assertions.assertEquals(new BigDecimal("12.00"), received.totalCost());
		Assertions.assertEquals(1, received.items().size());
		Assertions.assertEquals(4, received.items().getFirst().quantity());
		Assertions.assertEquals(4,
				productService.listVariants(product.id(), false).stream()
						.filter(item -> item.variantItemId().equals(variant.variantItemId()))
						.findFirst().orElseThrow().stockQuantity());

		User user = userRepository.saveAndFlush(User.builder()
				.firstName("Test").lastName("Customer").email("promotion-order-test@example.test")
				.passwordHash("test-password-hash").role(Role.ROLE_CUSTOMER).emailVerified(true).build());
		Customer customer = customerRepository.saveAndFlush(Customer.builder().user(user).build());
		Address address = addressRepository.saveAndFlush(Address.builder()
				.customer(customer).street("1 Test Road").city("Cairo")
				.countryCode("EG").addressType(AddressType.HOME).build());
		var order = orderService.create(customer.getId(), new CreateOrderRequest(address.getId(), null,
				List.of(new OrderLineRequest(variant.variantItemId(), 1))));
		Assertions.assertEquals(new BigDecimal("24.75"), order.totalPrice());

		var wishListItem = wishListService.add(customer.getId(), product.id());
		Assertions.assertEquals(product.id(), wishListItem.productId());
		Assertions.assertEquals("https://example.test/item-2.jpg", wishListItem.imageUrl());
		var wishListItems = wishListService.listMine(customer.getId());
		Assertions.assertEquals(1, wishListItems.size());
		Assertions.assertEquals("https://example.test/item-2.jpg", wishListItems.getFirst().imageUrl());
		wishListService.remove(customer.getId(), product.id());
		Assertions.assertTrue(wishListService.listMine(customer.getId()).isEmpty());
		var review = productReviewService.create(customer.getId(), product.id(),
				new ProductReviewRequest("Useful", "Fits as expected", 5, true));
		Assertions.assertEquals(5, review.rating());
		Assertions.assertEquals(1, productReviewService.summary(product.id()).reviewCount());
		Assertions.assertEquals(new BigDecimal("5.00"),
				productReviewService.summary(product.id()).averageRating());
		productReviewService.update(customer.getId(), review.id(),
				new ProductReviewRequest("Updated", "Still useful", 4, false));
		Assertions.assertEquals(new BigDecimal("4.00"),
				productReviewService.summary(product.id()).averageRating());
		productReviewService.delete(customer.getId(), review.id());
		Assertions.assertEquals(0, productReviewService.summary(product.id()).reviewCount());

		var cart = cartService.add(customer.getId(), new CartItemRequest(variant.variantItemId(), 1));
		cartService.add(customer.getId(), new CartItemRequest(variant.variantItemId(), 1));
		cart = cartService.setQuantity(customer.getId(), variant.variantItemId(),
				new UpdateCartItemRequest(1));
		Assertions.assertEquals(1, cart.items().size());
		Assertions.assertEquals("https://example.test/item-2.jpg", cart.items().getFirst().imageUrl());
		Assertions.assertEquals(new BigDecimal("24.75"), cart.total());
		var cartOrder = cartService.checkout(customer.getId(),
				new com.newtin.eco.dto.request.CartCheckoutRequest(address.getId(), null));
		Assertions.assertEquals(new BigDecimal("24.75"), cartOrder.totalPrice());
		Assertions.assertEquals(com.newtin.eco.enums.CartStatus.COMPLETED,
				shoppingCartRepository.findById(cart.id()).orElseThrow().getStatus());
		var nextCart = cartService.getActive(customer.getId());
		Assertions.assertTrue(nextCart.items().isEmpty());
		cartService.abandon(customer.getId());
		Assertions.assertEquals(com.newtin.eco.enums.CartStatus.ABANDONED,
				shoppingCartRepository.findById(nextCart.id()).orElseThrow().getStatus());

		promotionService.setActive(null, promotion.id(), false);
		Assertions.assertEquals(new BigDecimal("27.50"),
				productService.getPublic(product.id()).variants().stream()
						.filter(item -> item.variantItemId().equals(variant.variantItemId()))
						.findFirst().orElseThrow().currentPrice());
	}

}
