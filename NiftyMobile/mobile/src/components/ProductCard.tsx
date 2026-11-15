import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Product, ProductVariant } from '../api/commerceTypes';
import { formatMoney } from '../lib/commerce';
import { useAppTheme } from '../ThemeProvider';
import { Button, Card } from './ui';

function variantPrice(product: Product): ProductVariant | undefined {
  return (product.variants ?? [])
    .filter((variant) => variant.active)
    .sort((left, right) => left.currentPrice - right.currentPrice)[0];
}

function mainImage(product: Product): string | null {
  const variants = product.variants ?? [];
  const variant =
    variants.find((item) => item.defaultVariant) ??
    variants.find((item) => item.active) ??
    variants[0];
  const images = variant?.images ?? [];
  return (images.find((item) => item.main) ?? images[0])?.imageUrl ?? null;
}

export function ProductCard({
  product,
  isCustomer,
  wishlisted,
  wishlistBusy,
  onToggleWishlist,
}: {
  product: Product;
  isCustomer: boolean;
  wishlisted: boolean;
  wishlistBusy: boolean;
  onToggleWishlist: (product: Product) => void;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = mainImage(product);
  const price = variantPrice(product);
  const onSale =
    price && Number(price.currentPrice) < Number(price.regularPrice);

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${product.name}`}
        onPress={() => router.push(`/shop/products/${product.id}`)}
        style={styles.imageWrap}
      >
        {imageUrl && !imageFailed ? (
          <Image
            accessibilityLabel={product.name}
            onError={() => setImageFailed(true)}
            resizeMode="cover"
            source={{ uri: imageUrl }}
            style={styles.image}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackText}>N</Text>
          </View>
        )}
        {onSale ? (
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>Offer</Text>
          </View>
        ) : null}
      </Pressable>
      <View style={styles.info}>
        <Text style={styles.category}>
          {product.categoryName || product.type?.toLowerCase()}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {price ? (
          <View style={styles.prices}>
            <Text style={styles.currentPrice}>
              {formatMoney(price.currentPrice)}
            </Text>
            {onSale ? (
              <Text style={styles.regularPrice}>
                {formatMoney(price.regularPrice)}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.muted}>Price unavailable</Text>
        )}
        {price && price.stockQuantity > 0 && price.stockQuantity <= 5 ? (
          <Text style={styles.lowStock}>Only a few left</Text>
        ) : null}
        {isCustomer ? (
          <Button
            title={wishlisted ? '♥ Saved' : '♡ Save'}
            variant="secondary"
            busy={wishlistBusy}
            onPress={() => onToggleWishlist(product)}
          />
        ) : null}
      </View>
    </Card>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  imageWrap: {
    aspectRatio: 0.95,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceAlt,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.infoBackground,
  },
  fallbackText: {
    color: theme.colors.skyDeep,
    fontSize: 48,
    fontWeight: '800',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.successBackground,
  },
  saleText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    gap: 7,
  },
  category: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    color: theme.colors.ink,
    minHeight: 42,
    fontSize: 15,
    fontWeight: '700',
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  currentPrice: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  regularPrice: {
    color: theme.colors.muted,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  lowStock: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  });
}
