import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../auth/useSession';
import type { Category, Product, Promotion, WishlistItem } from '../../api/commerceTypes';
import { catalogApi } from '../../api/catalogApi';
import { wishlistApi } from '../../api/customerCommerceApi';
import { useScreenTitle } from '../../components/AppShell';
import { Pagination } from '../../components/Pagination';
import { ProductCard } from '../../components/ProductCard';
import { SelectField } from '../../components/SelectField';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  TextField,
} from '../../components/ui';
import { useApiResource } from '../../hooks/useApiResource';
import { normalizePage } from '../../lib/commerce';
import WheelPager, { type WheelPage } from '../../components/wheel/WheelPager';
import { useAppTheme } from '../../ThemeProvider';

const TYPES = [
  { value: '', label: 'All product types' },
  { value: 'CLOTHING', label: 'Clothing' },
  { value: 'ACCESSORY', label: 'Accessories' },
  { value: 'SKINCARE', label: 'Skincare' },
];

function orderedCategories(categories: Category[]) {
  const children = new Map<number | null, Category[]>();
  for (const category of categories) {
    const parentId = category.parentCategoryId ?? null;
    children.set(parentId, [...(children.get(parentId) ?? []), category]);
  }

  const ordered: (Category & { depth: number })[] = [];
  function visit(parentId: number | null, depth: number) {
    for (const category of children.get(parentId) ?? []) {
      ordered.push({ ...category, depth });
      visit(category.id, depth + 1);
    }
  }
  visit(null, 0);
  return ordered;
}

function featuredPages(promotions: Promotion[]): WheelPage[] {
  return promotions.slice(0, 3).map((promotion, index) => {
    const selectedProducts =
      Boolean(promotion.productIds?.length) ||
      Boolean(promotion.categoryIds?.length);
    const amount =
      promotion.discountType === 'PERCENTAGE'
        ? `${Number(promotion.discountValue)}% off`
        : new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 2,
          }).format(Number(promotion.discountValue));

    return {
      id: String(promotion.id),
      discountLabel:
        promotion.discountType === 'PERCENTAGE'
          ? amount
          : `${amount} off`,
      title: promotion.name,
      description:
        promotion.description ||
        (selectedProducts
          ? 'A little something extra on selected products.'
          : 'A little something extra across the store.'),
      scope: selectedProducts ? 'SELECTED PRODUCTS' : 'ACROSS THE STORE',
      tone: index % 2 === 0 ? 'leaf' : 'sky',
    };
  });
}

export default function ShopScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useSession();
  const isCustomer = user?.role === 'ROLE_CUSTOMER';
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [wishlistBusyId, setWishlistBusyId] = useState<number | null>(null);
  const [wishlistError, setWishlistError] = useState('');
  const [wishlistOverrides, setWishlistOverrides] = useState<
    Record<string, boolean>
  >({});

  const loadProducts = useCallback(
    () => catalogApi.products({ categoryId, type, page, size: 12 }),
    [categoryId, type, page],
  );
  const loadCategories = useCallback(() => catalogApi.categories(), []);
  const loadPromotions = useCallback(() => catalogApi.promotions(), []);
  const loadWishlist = useCallback(
    () =>
      isCustomer
        ? wishlistApi.list()
        : Promise.resolve([] as WishlistItem[]),
    [isCustomer],
  );

  const productsState = useApiResource(loadProducts);
  const categoriesState = useApiResource(loadCategories);
  const promotionsState = useApiResource(loadPromotions);
  const wishlistState = useApiResource(loadWishlist);

  const productPage = normalizePage(productsState.data);
  const categories = useMemo(
    () => categoriesState.data ?? [],
    [categoriesState.data],
  );
  const categoryList = useMemo(() => orderedCategories(categories), [categories]);
  const promotionList = normalizePage(promotionsState.data).items;
  const offers = useMemo(() => featuredPages(promotionList), [promotionList]);
  const wishlistedIds = useMemo(
    () =>
      new Set(
        (wishlistState.data ?? []).map((item) => String(item.productId)),
      ),
    [wishlistState.data],
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? productPage.items.filter((product) =>
          `${product.name} ${product.description ?? ''} ${product.categoryName ?? ''}`
            .toLowerCase()
            .includes(query),
        )
      : productPage.items;
  }, [productPage.items, search]);

  useScreenTitle('Shop');

  async function toggleWishlist(product: Product) {
    const key = String(product.id);
    const saved = wishlistOverrides[key] ?? wishlistedIds.has(key);
    setWishlistBusyId(product.id);
    setWishlistError('');
    try {
      if (saved) {
        await wishlistApi.remove(product.id);
      } else {
        await wishlistApi.add(product.id);
      }
      setWishlistOverrides((previous) => ({ ...previous, [key]: !saved }));
    } catch (error) {
      setWishlistError(
        error instanceof Error ? error.message : 'Unable to update your wishlist.',
      );
    } finally {
      setWishlistBusyId(null);
    }
  }

  function updateCategory(value: string) {
    setCategoryId(value);
    setPage(0);
  }

  function updateType(value: string) {
    setType(value);
    setPage(0);
  }

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.kicker}>WELCOME TO NIFTY</Text>
        <PageTitle
          title="Find your new everyday favorite."
          subtitle="Thoughtful pieces for your wardrobe, your routine, and everything in between."
        />
      </View>

      <View style={styles.section}>
        <PageTitle
          title="Current offers"
          subtitle="A little something extra, directly from the store."
        />
        {promotionsState.error ? (
          <ErrorState
            message={promotionsState.error}
            onRetry={promotionsState.reload}
          />
        ) : promotionsState.loading && !promotionsState.data ? (
          <Card>
            <Text style={styles.muted}>Finding current offers…</Text>
          </Card>
        ) : offers.length === 0 ? (
          <EmptyState
            title="No active offers"
            description="Check back soon for something special."
          />
        ) : (
          <View style={styles.pager}>
            <WheelPager
              key={offers.map((offer) => offer.id).join('|')}
              pages={offers}
              accessibilityLabel="Current offers"
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.collectionHeading}>
          <PageTitle
            title="Explore the collection"
            subtitle={`${productPage.total} ${
              productPage.total === 1 ? 'piece' : 'pieces'
            }`}
          />
          <Text style={styles.kicker}>MADE FOR YOUR RHYTHM</Text>
        </View>

        <SelectField
          label="Category"
          value={categoryId}
          onChange={updateCategory}
          options={[
            { label: 'All categories', value: '' },
            ...categoryList.map((category) => ({
              label: `${'— '.repeat(category.depth)}${category.name}`,
              value: String(category.id),
            })),
          ]}
        />
        <SelectField
          label="Product type"
          value={type}
          onChange={updateType}
          options={TYPES}
        />
        <TextField
          label="Search this page"
          placeholder="Product or category"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {categoriesState.error ? (
          <Alert tone="error">
            Categories could not be loaded: {categoriesState.error}
          </Alert>
        ) : null}
        {wishlistState.error && isCustomer ? (
          <ErrorState
            message={`Wishlist status could not be loaded: ${wishlistState.error}`}
            onRetry={wishlistState.reload}
          />
        ) : null}
        {wishlistError ? <Alert tone="error">{wishlistError}</Alert> : null}
        {productsState.error ? (
          <ErrorState
            message={productsState.error}
            onRetry={productsState.reload}
          />
        ) : null}
        {productsState.loading && !productsState.data ? (
          <Card>
            <Text style={styles.muted}>Loading products…</Text>
          </Card>
        ) : null}
        {!productsState.loading &&
        !productsState.error &&
        visibleProducts.length === 0 ? (
          <EmptyState
            title={search ? 'No matching pieces' : 'Nothing here just yet'}
            description={
              search
                ? 'Try another search.'
                : 'Try a different category or product type.'
            }
          />
        ) : null}

        <View style={styles.productGrid}>
          {visibleProducts.map((product) => {
            const key = String(product.id);
            return (
              <View key={product.id} style={styles.productCell}>
                <ProductCard
                  product={product}
                  isCustomer={Boolean(isCustomer)}
                  wishlisted={
                    wishlistOverrides[key] ?? wishlistedIds.has(key)
                  }
                  wishlistBusy={
                    wishlistBusyId === product.id ||
                    (wishlistState.loading && !wishlistState.data) ||
                    Boolean(wishlistState.error)
                  }
                  onToggleWishlist={(item) => void toggleWishlist(item)}
                />
              </View>
            );
          })}
        </View>
        <Pagination
          page={productPage.page}
          totalPages={productPage.totalPages}
          onChange={setPage}
        />
        {productsState.loading && productsState.data ? (
          <Button
            title="Refreshing products…"
            disabled
            variant="secondary"
            onPress={() => undefined}
          />
        ) : null}
      </View>
    </>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  hero: {
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  kicker: {
    color: theme.colors.leafDeep,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  section: {
    gap: 14,
  },
  collectionHeading: {
    gap: 6,
  },
  pager: {
    height: 245,
    overflow: 'hidden',
    borderRadius: theme.radius.card,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCell: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 145,
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  });
}