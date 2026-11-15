import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../../auth/useSession';
import { catalogApi } from '../../../api/catalogApi';
import {
  cartApi,
  reviewApi,
  wishlistApi,
} from '../../../api/customerCommerceApi';
import type { ProductReview, ProductVariant } from '../../../api/commerceTypes';
import { useScreenTitle } from '../../../components/AppShell';
import { Pagination } from '../../../components/Pagination';
import { SelectField } from '../../../components/SelectField';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  TextField,
} from '../../../components/ui';
import { useApiResource } from '../../../hooks/useApiResource';
import { formatMoney, normalizePage, prettyStatus } from '../../../lib/commerce';
import { useAppTheme } from '../../../ThemeProvider';

type ReviewDraft = {
  title: string;
  text: string;
  rating: string;
  recommended: string;
};

const EMPTY_REVIEW: ReviewDraft = {
  title: '',
  text: '',
  rating: '5',
  recommended: '',
};

function variantDescription(variant: ProductVariant) {
  const details = [
    variant.size,
    variant.color,
    variant.material,
    variant.sizeLabel,
    variant.volumeMl ? `${variant.volumeMl} ml` : null,
    variant.formulation,
    variant.additionalDescription,
  ].filter(Boolean);
  return details.length ? details.join(' · ') : 'Standard';
}

function reviewDraft(review?: ProductReview): ReviewDraft {
  return review
    ? {
        title: review.title ?? '',
        text: review.text ?? '',
        rating: String(review.rating),
        recommended:
          review.recommended == null ? '' : String(review.recommended),
      }
    : EMPTY_REVIEW;
}

export default function ProductDetailScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { id: routeId } = useLocalSearchParams<{ id?: string }>();
  const id =
    typeof routeId === 'string' && /^\d+$/.test(routeId)
      ? Number(routeId)
      : null;
  const { user } = useSession();
  const isCustomer = user?.role === 'ROLE_CUSTOMER';
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [wishlistOverride, setWishlistOverride] = useState<boolean | null>(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [cartBusy, setCartBusy] = useState(false);
  const [cartError, setCartError] = useState('');
  const [reviewDraftOverride, setReviewDraftOverride] =
    useState<ReviewDraft | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [confirmReviewDelete, setConfirmReviewDelete] = useState(false);

  const loadProduct = useCallback(() => {
    if (id === null) {
      throw new Error('Invalid product link.');
    }
    return catalogApi.product(id);
  }, [id]);
  const loadReviews = useCallback(() => {
    if (id === null) {
      throw new Error('Invalid product link.');
    }
    return reviewApi.listPublic(id, reviewPage, 5);
  }, [id, reviewPage]);
  const loadSummary = useCallback(() => {
    if (id === null) {
      throw new Error('Invalid product link.');
    }
    return reviewApi.summary(id);
  }, [id]);
  const loadMyReviews = useCallback(
    () => (isCustomer ? reviewApi.listMine() : Promise.resolve(null)),
    [isCustomer],
  );
  const loadWishlist = useCallback(
    () => (isCustomer ? wishlistApi.list() : Promise.resolve([])),
    [isCustomer],
  );

  const productState = useApiResource(loadProduct);
  const reviewsState = useApiResource(loadReviews);
  const summaryState = useApiResource(loadSummary);
  const myReviewsState = useApiResource(loadMyReviews);
  const wishlistState = useApiResource(loadWishlist);

  const product = productState.data;
  const variants = product?.variants ?? [];
  const selectedVariant =
    variants.find((variant) => variant.variantItemId === selectedVariantId) ??
    variants.find((variant) => variant.defaultVariant) ??
    variants[0];
  const images = useMemo(
    () =>
      [...(selectedVariant?.images ?? [])].sort(
        (left, right) =>
          Number(right.main) - Number(left.main) ||
          left.displayOrder - right.displayOrder,
      ),
    [selectedVariant],
  );
  const selectedImage =
    images.find((image) => image.id === selectedImageId) ?? images[0];
  const publicReviews = normalizePage(reviewsState.data);
  const myReviews = normalizePage(myReviewsState.data).items;
  const ownReview = myReviews.find((review) => review.productId === id);
  const draft = reviewDraftOverride ?? reviewDraft(ownReview);
  const isWishlisted =
    wishlistOverride ??
    (wishlistState.data ?? []).some((item) => item.productId === id);
  const typeDetails = Object.entries(product?.typeDetails ?? {});
  const onSale =
    selectedVariant &&
    Number(selectedVariant.currentPrice) <
      Number(selectedVariant.regularPrice);
  const canAddToCart =
    isCustomer &&
    Boolean(selectedVariant?.active && selectedVariant.stockQuantity > 0);

  const pageTitle = product?.name ?? 'Product';
  useScreenTitle(pageTitle);

  async function toggleWishlist() {
    if (!product || id === null) {
      return;
    }
    setWishlistBusy(true);
    setWishlistError('');
    try {
      if (isWishlisted) {
        await wishlistApi.remove(id);
      } else {
        await wishlistApi.add(id);
      }
      setWishlistOverride(!isWishlisted);
      wishlistState.reload();
    } catch (error) {
      setWishlistError(
        error instanceof Error ? error.message : 'Unable to update your wishlist.',
      );
    } finally {
      setWishlistBusy(false);
    }
  }

  async function addToCart() {
    if (!selectedVariant || !canAddToCart) {
      return;
    }
    setCartBusy(true);
    setCartError('');
    try {
      await cartApi.add(selectedVariant.variantItemId, 1);
      router.push('/account/cart');
    } catch (error) {
      setCartError(
        error instanceof Error ? error.message : 'Unable to add this item.',
      );
      setCartBusy(false);
    }
  }

  function changeReview<K extends keyof ReviewDraft>(
    key: K,
    value: ReviewDraft[K],
  ) {
    setReviewDraftOverride((previous) => ({
      ...(previous ?? reviewDraft(ownReview)),
      [key]: value,
    }));
  }

  async function saveReview() {
    if (!product || id === null) {
      return;
    }
    const rating = Number(draft.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewError('Choose a rating from 1 to 5.');
      return;
    }
    setReviewBusy(true);
    setReviewError('');
    setReviewNotice('');
    try {
      const body = {
        title: draft.title.trim() || null,
        text: draft.text.trim() || null,
        rating,
        recommended:
          draft.recommended === ''
            ? null
            : draft.recommended === 'true',
      };
      if (ownReview) {
        await reviewApi.update(ownReview.id, body);
        setReviewNotice('Your review has been updated.');
      } else {
        await reviewApi.create(id, body);
        setReviewNotice('Thanks for sharing your review.');
      }
      setReviewDraftOverride(null);
      setConfirmReviewDelete(false);
      myReviewsState.reload();
      reviewsState.reload();
      summaryState.reload();
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : 'Unable to save your review.',
      );
    } finally {
      setReviewBusy(false);
    }
  }

  async function deleteReview() {
    if (!ownReview) {
      return;
    }
    setReviewBusy(true);
    setReviewError('');
    setReviewNotice('');
    try {
      await reviewApi.remove(ownReview.id);
      setReviewDraftOverride(null);
      setConfirmReviewDelete(false);
      setReviewNotice('Your review has been removed.');
      myReviewsState.reload();
      reviewsState.reload();
      summaryState.reload();
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : 'Unable to remove your review.',
      );
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <>
      <Button
        title="Back to shop"
        variant="ghost"
        onPress={() => router.push('/shop')}
      />
      {productState.error ? (
        <ErrorState
          message={productState.error}
          onRetry={productState.reload}
        />
      ) : null}
      {productState.loading && !product ? (
        <Card>
          <Text style={styles.muted}>Loading product…</Text>
        </Card>
      ) : null}
      {product ? (
        <>
          <View style={styles.product}>
            <View style={styles.gallery}>
              <View style={styles.mainImage}>
                <Text style={styles.imagePlaceholder}>N</Text>
                {selectedImage ? (
                  <Image
                    accessibilityLabel={
                      selectedImage.altText || product.name
                    }
                    resizeMode="cover"
                    source={{ uri: selectedImage.imageUrl }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
              </View>
              {images.length > 1 ? (
                <View style={styles.thumbnails}>
                  {images.map((image, index) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        image.altText || `Show image ${index + 1}`
                      }
                      accessibilityState={{
                        selected: selectedImage?.id === image.id,
                      }}
                      key={image.id}
                      onPress={() => setSelectedImageId(image.id)}
                      style={[
                        styles.thumbnail,
                        selectedImage?.id === image.id &&
                          styles.thumbnailSelected,
                      ]}
                    >
                      <Image
                        resizeMode="cover"
                        source={{ uri: image.imageUrl }}
                        style={styles.thumbnailImage}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.info}>
              <Text style={styles.kicker}>
                {product.categoryName || product.type?.toLowerCase()}
              </Text>
              <PageTitle title={product.name} />
              <Text style={styles.muted}>{prettyStatus(product.type)}</Text>
              {summaryState.error ? (
                <Text style={styles.muted}>Reviews are unavailable right now.</Text>
              ) : summaryState.data?.reviewCount ? (
                <Text style={styles.rating}>
                  ★ {Number(summaryState.data.averageRating).toFixed(1)} (
                  {summaryState.data.reviewCount} reviews)
                </Text>
              ) : (
                <Text style={styles.muted}>No reviews yet</Text>
              )}
              {selectedVariant ? (
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    {formatMoney(selectedVariant.currentPrice)}
                  </Text>
                  {onSale ? (
                    <Text style={styles.regularPrice}>
                      {formatMoney(selectedVariant.regularPrice)}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.muted}>Price unavailable</Text>
              )}
              {onSale && selectedVariant?.promotion ? (
                <Text style={styles.offer}>
                  {selectedVariant.promotion.name} · You save{' '}
                  {formatMoney(
                    Number(selectedVariant.regularPrice) -
                      Number(selectedVariant.currentPrice),
                  )}
                </Text>
              ) : null}
              {product.description ? (
                <Text style={styles.description}>{product.description}</Text>
              ) : null}
              {variants.length ? (
                <SelectField
                  label="Choose an option"
                  value={
                    selectedVariant
                      ? String(selectedVariant.variantItemId)
                      : ''
                  }
                  onChange={(value) => {
                    setSelectedVariantId(Number(value));
                    setSelectedImageId(null);
                  }}
                  options={variants.map((variant) => ({
                    value: String(variant.variantItemId),
                    label: `${variantDescription(variant)}${
                      variant.active
                        ? variant.stockQuantity > 0
                          ? ''
                          : ' · Out of stock'
                        : ' · Unavailable'
                    }`,
                  }))}
                />
              ) : null}
              {selectedVariant ? (
                <Text
                  style={
                    selectedVariant.stockQuantity > 0 && selectedVariant.active
                      ? styles.stock
                      : styles.outOfStock
                  }
                >
                  {!selectedVariant.active
                    ? 'Currently unavailable'
                    : selectedVariant.stockQuantity > 0
                    ? selectedVariant.stockQuantity <= 5
                      ? `Only ${selectedVariant.stockQuantity} left`
                      : 'In stock'
                    : 'Out of stock'}
                </Text>
              ) : null}
              {typeDetails.length ? (
                <View style={styles.facts}>
                  {typeDetails.map(([key, value]) => (
                    <View key={key} style={styles.fact}>
                      <Text style={styles.factLabel}>
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (letter) => letter.toUpperCase())}
                      </Text>
                      <Text style={styles.factValue}>
                        {value === null ? '—' : String(value)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {isCustomer ? (
                <>
                  <Button
                    title={
                      selectedVariant?.stockQuantity
                        ? 'Add to cart'
                        : 'Out of stock'
                    }
                    busy={cartBusy}
                    disabled={!canAddToCart}
                    onPress={() => void addToCart()}
                  />
                  <Button
                    title={isWishlisted ? '♥ Saved to wishlist' : '♡ Save to wishlist'}
                    variant="secondary"
                    busy={wishlistBusy}
                    disabled={wishlistState.loading || Boolean(wishlistState.error)}
                    onPress={() => void toggleWishlist()}
                  />
                  {wishlistState.error ? (
                    <ErrorState
                      message={wishlistState.error}
                      onRetry={wishlistState.reload}
                    />
                  ) : null}
                  {wishlistError ? (
                    <Alert tone="error">{wishlistError}</Alert>
                  ) : null}
                  {cartError ? <Alert tone="error">{cartError}</Alert> : null}
                </>
              ) : user ? (
                <Alert tone="info">
                  Customer accounts can add items and reviews.
                </Alert>
              ) : null}
            </View>
          </View>

          {product.details ? (
            <Card>
              <PageTitle title="More about this piece" />
              <Text style={styles.description}>{product.details}</Text>
            </Card>
          ) : null}

          <View style={styles.section}>
            <PageTitle
              title="Customer reviews"
              subtitle={
                summaryState.data
                  ? `${Number(summaryState.data.averageRating).toFixed(1)} out of 5 · ${summaryState.data.reviewCount} reviews`
                  : undefined
              }
            />
            {isCustomer ? (
              <Card>
                <PageTitle
                  title={ownReview ? 'Your review' : 'Share your thoughts'}
                />
                {reviewError ? <Alert tone="error">{reviewError}</Alert> : null}
                {reviewNotice ? (
                  <Alert tone="success">{reviewNotice}</Alert>
                ) : null}
                {myReviewsState.error ? (
                  <ErrorState
                    message={myReviewsState.error}
                    onRetry={myReviewsState.reload}
                  />
                ) : null}
                <Text style={styles.label}>Your rating</Text>
                <View style={styles.ratingChoices}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${rating} ${
                        rating === 1 ? 'star' : 'stars'
                      }`}
                      accessibilityState={{
                        selected: Number(draft.rating) === rating,
                      }}
                      key={rating}
                      onPress={() => changeReview('rating', String(rating))}
                      style={[
                        styles.ratingChoice,
                        Number(draft.rating) === rating &&
                          styles.ratingChoiceSelected,
                      ]}
                    >
                      <Text style={styles.ratingChoiceText}>{rating} ★</Text>
                    </Pressable>
                  ))}
                </View>
                <TextField
                  label="Title (optional)"
                  value={draft.title}
                  onChangeText={(value) => changeReview('title', value)}
                  maxLength={200}
                />
                <TextField
                  label="Your review (optional)"
                  value={draft.text}
                  onChangeText={(value) => changeReview('text', value)}
                  multiline
                  maxLength={10000}
                  hint={`${draft.text.length} / 10000`}
                />
                <SelectField
                  label="Would you recommend this product?"
                  value={draft.recommended}
                  onChange={(value) => changeReview('recommended', value)}
                  options={[
                    { value: '', label: 'Prefer not to say' },
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
                <Button
                  title={ownReview ? 'Update review' : 'Submit review'}
                  busy={reviewBusy || myReviewsState.loading}
                  onPress={() => void saveReview()}
                />
                {ownReview ? (
                  confirmReviewDelete ? (
                    <>
                      <Alert tone="info">
                        Remove your review? This cannot be undone.
                      </Alert>
                      <Button
                        title="Confirm delete"
                        busy={reviewBusy}
                        onPress={() => void deleteReview()}
                      />
                      <Button
                        title="Keep review"
                        variant="ghost"
                        onPress={() => setConfirmReviewDelete(false)}
                      />
                    </>
                  ) : (
                    <Button
                      title="Delete review"
                      variant="ghost"
                      onPress={() => setConfirmReviewDelete(true)}
                    />
                  )
                ) : null}
              </Card>
            ) : !user ? (
              <Alert tone="info">
                Log in with a customer account to share your review.
              </Alert>
            ) : null}
            {reviewsState.error ? (
              <ErrorState
                message={reviewsState.error}
                onRetry={reviewsState.reload}
              />
            ) : null}
            {!reviewsState.loading &&
            !reviewsState.error &&
            publicReviews.items.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Be the first to share what you think."
              />
            ) : null}
            {publicReviews.items.map((review) => (
              <Card key={review.id}>
                <Text style={styles.reviewHeader}>
                  {review.customerName} · {'★'.repeat(review.rating)}
                  {'☆'.repeat(Math.max(0, 5 - review.rating))}
                </Text>
                {review.title ? (
                  <Text style={styles.reviewTitle}>{review.title}</Text>
                ) : null}
                {review.text ? (
                  <Text style={styles.description}>{review.text}</Text>
                ) : null}
                {review.recommended !== null ? (
                  <Text style={styles.muted}>
                    {review.recommended
                      ? 'Recommends this product'
                      : 'Does not recommend this product'}
                  </Text>
                ) : null}
              </Card>
            ))}
            <Pagination
              page={publicReviews.page}
              totalPages={publicReviews.totalPages}
              onChange={setReviewPage}
            />
          </View>
        </>
      ) : null}
    </>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    product: {
      gap: 20,
    },
    gallery: {
      gap: 10,
    },
    mainImage: {
      height: 330,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.card,
      backgroundColor: theme.colors.infoBackground,
    },
    imagePlaceholder: {
      color: theme.colors.skyDeep,
      fontSize: 64,
      fontWeight: '800',
    },
    thumbnails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    thumbnail: {
      width: 64,
      height: 64,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: 12,
    },
    thumbnailSelected: {
      borderColor: theme.colors.leafDeep,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    info: {
      gap: 12,
    },
    kicker: {
      color: theme.colors.leafDeep,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
    },
    price: {
      color: theme.colors.ink,
      fontSize: 22,
      fontWeight: '800',
    },
    regularPrice: {
      color: theme.colors.muted,
      textDecorationLine: 'line-through',
    },
    offer: {
      color: theme.colors.success,
      fontSize: 13,
      fontWeight: '600',
    },
    description: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 23,
    },
    stock: {
      color: theme.colors.success,
      fontWeight: '700',
    },
    outOfStock: {
      color: theme.colors.danger,
      fontWeight: '700',
    },
    facts: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.line,
    },
    fact: {
      paddingVertical: 9,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.line,
    },
    factLabel: {
      flex: 1,
      color: theme.colors.muted,
      fontSize: 13,
    },
    factValue: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 13,
      textAlign: 'right',
    },
    section: {
      gap: 14,
    },
    label: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    rating: {
      color: theme.colors.leafDeep,
      fontWeight: '700',
    },
    ratingChoices: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    ratingChoice: {
      minHeight: 40,
      paddingHorizontal: 12,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: theme.radius.pill,
    },
    ratingChoiceSelected: {
      borderColor: theme.colors.leafDeep,
      backgroundColor: theme.colors.successBackground,
    },
    ratingChoiceText: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    reviewHeader: {
      color: theme.colors.leafDeep,
      fontWeight: '700',
    },
    reviewTitle: {
      color: theme.colors.ink,
      fontSize: 17,
      fontWeight: '700',
    },
    muted: {
      color: theme.colors.muted,
      fontSize: 14,
    },
  });
}