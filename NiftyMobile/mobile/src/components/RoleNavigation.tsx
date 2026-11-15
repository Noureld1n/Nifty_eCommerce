import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname, type Href } from 'expo-router';
import type { UserRole } from '../api/types';
import { useAppTheme } from '../ThemeProvider';

export type NavigationItem = {
  label: string;
  href: Href;
  icon: 'shop' | 'wishlist' | 'cart' | 'orders' | 'account' | 'overview' | 'catalog' | 'more' | 'login';
};

const CUSTOMER_ITEMS: NavigationItem[] = [
  { label: 'Shop', href: '/shop', icon: 'shop' },
  { label: 'Saved', href: '/account/wishlist', icon: 'wishlist' },
  { label: 'Cart', href: '/account/cart', icon: 'cart' },
  { label: 'Orders', href: '/account/orders', icon: 'orders' },
  { label: 'Account', href: '/account/profile', icon: 'account' },
];

const ADMIN_ITEMS: NavigationItem[] = [
  { label: 'Overview', href: '/admin/analytics', icon: 'overview' },
  { label: 'Catalog', href: '/admin/catalog', icon: 'catalog' },
  { label: 'Orders', href: '/admin/orders', icon: 'orders' },
  { label: 'More', href: '/admin/more', icon: 'more' },
  { label: 'Shop', href: '/shop', icon: 'shop' },
];

const GUEST_ITEMS: NavigationItem[] = [
  { label: 'Shop', href: '/shop', icon: 'shop' },
  { label: 'Log in', href: '/login', icon: 'login' },
];

export function getRoleNavigationItems(
  role: UserRole | null,
): NavigationItem[] {
  return role === 'ROLE_ADMIN'
    ? ADMIN_ITEMS
    : role === 'ROLE_CUSTOMER'
      ? CUSTOMER_ITEMS
      : GUEST_ITEMS;
}

export function navigationIndexForPath(
  pathname: string,
  role: UserRole | null,
): number {
  const items = getRoleNavigationItems(role);
  const matchedIndex = items.findIndex(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`),
  );
  if (matchedIndex >= 0) {
    return matchedIndex;
  }

  if (role === 'ROLE_CUSTOMER' && pathname.startsWith('/account/')) {
    return items.findIndex((item) => item.icon === 'account');
  }
  if (role === 'ROLE_ADMIN' && pathname.startsWith('/admin/')) {
    return items.findIndex((item) => item.icon === 'more');
  }
  return -1;
}

function TabIcon({
  name,
  active,
}: {
  name: NavigationItem['icon'];
  active: boolean;
}) {
  const { theme, styles } = useStyles();
  const color = active ? theme.colors.leafDeep : theme.colors.muted;

  if (name === 'wishlist') {
    return <Text style={[styles.heart, { color }]}>♡</Text>;
  }
  if (name === 'shop' || name === 'cart') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.bagHandle, { borderColor: color }]} />
        <View style={[styles.bagBody, { borderColor: color, backgroundColor: active ? theme.colors.successBackground : 'transparent' }]} />
        {name === 'cart' ? (
          <View style={styles.wheels}>
            <View style={[styles.wheel, { backgroundColor: color }]} />
            <View style={[styles.wheel, { backgroundColor: color }]} />
          </View>
        ) : null}
      </View>
    );
  }
  if (name === 'orders') {
    return (
      <View style={[styles.document, { borderColor: color }]}>
        <View style={[styles.documentLine, { backgroundColor: color }]} />
        <View style={[styles.documentLine, { backgroundColor: color }]} />
        <View style={[styles.documentLineShort, { backgroundColor: color }]} />
      </View>
    );
  }
  if (name === 'account' || name === 'login') {
    return (
      <View style={styles.person}>
        <View style={[styles.personHead, { borderColor: color }]} />
        <View style={[styles.personBody, { borderColor: color }]} />
      </View>
    );
  }
  if (name === 'catalog') {
    return (
      <View style={styles.gridIcon}>
        {[0, 1, 2, 3].map((cell) => (
          <View
            key={cell}
            style={[
              styles.gridCell,
              { borderColor: color, backgroundColor: active ? theme.colors.successBackground : 'transparent' },
            ]}
          />
        ))}
      </View>
    );
  }
  if (name === 'more') {
    return (
      <View style={styles.moreIcon}>
        {[0, 1, 2].map((dot) => (
          <View key={dot} style={[styles.moreDot, { backgroundColor: color }]} />
        ))}
      </View>
    );
  }
  return (
    <View style={[styles.chartIcon, { borderColor: color }]}>
      <View style={[styles.chartBar, styles.chartBarSmall, { backgroundColor: color }]} />
      <View style={[styles.chartBar, styles.chartBarMedium, { backgroundColor: color }]} />
      <View style={[styles.chartBar, styles.chartBarTall, { backgroundColor: color }]} />
    </View>
  );
}

export function RoleNavigation({
  role,
  onNavigate,
}: {
  role: UserRole | null;
  onNavigate?: (href: Href) => void;
}) {
  const { styles } = useStyles();
  const pathname = usePathname();
  const items = getRoleNavigationItems(role);
  const activeIndex = navigationIndexForPath(pathname, role);

  return (
    <View style={styles.container}>
      <View style={styles.accent}>
        <View style={styles.accentLeaf} />
        <View style={styles.accentSky} />
      </View>
      <View style={styles.items}>
      {items.map((item) => {
        const active = items[activeIndex] === item;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() =>
              onNavigate ? onNavigate(item.href) : router.navigate(item.href)
            }
            style={styles.item}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <TabIcon name={item.icon} active={active} />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.label, active && styles.labelActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      </View>
    </View>
  );
}

function useStyles() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return { theme, styles };
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  accent: {
    height: 2,
    flexDirection: 'row',
  },
  accentLeaf: {
    flex: 1,
    backgroundColor: theme.colors.leaf,
  },
  accentSky: {
    flex: 1,
    backgroundColor: theme.colors.sky,
  },
  items: {
    minHeight: 64,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 42,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  iconWrapActive: {
    backgroundColor: theme.colors.successBackground,
  },
  label: {
    maxWidth: '100%',
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  labelActive: {
    color: theme.colors.leafDeep,
    fontWeight: '800',
  },
  glyph: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagHandle: {
    position: 'absolute',
    top: 2,
    width: 10,
    height: 8,
    borderWidth: 1.7,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  bagBody: {
    position: 'absolute',
    top: 8,
    width: 20,
    height: 14,
    borderWidth: 1.7,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  wheels: {
    position: 'absolute',
    bottom: 0,
    width: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wheel: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  heart: {
    fontSize: 29,
    lineHeight: 31,
    fontWeight: '500',
  },
  document: {
    width: 17,
    height: 21,
    padding: 4,
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1.7,
    borderRadius: 4,
  },
  documentLine: {
    width: 9,
    height: 1.5,
    borderRadius: 2,
  },
  documentLineShort: {
    width: 6,
    height: 1.5,
    borderRadius: 2,
  },
  person: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  personHead: {
    width: 9,
    height: 9,
    borderWidth: 1.7,
    borderRadius: 5,
  },
  personBody: {
    width: 18,
    height: 9,
    borderWidth: 1.7,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  gridIcon: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  gridCell: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  moreIcon: {
    width: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  chartIcon: {
    width: 22,
    height: 21,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  chartBar: {
    width: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  chartBarSmall: {
    height: 6,
  },
  chartBarMedium: {
    height: 11,
  },
  chartBarTall: {
    height: 16,
  },
  });
}
