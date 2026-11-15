import {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { userApi } from '../../api/authApi';
import type {
  AddressPayload,
  PaymentMethod,
  PaymentMethodPayload,
} from '../../api/commerceTypes';
import {
  addressApi,
  cartApi,
  orderApi,
  wishlistApi,
} from '../../api/customerCommerceApi';
import { useSession } from '../../auth/useSession';
import { AppShell } from '../AppShell';
import { Pagination } from '../Pagination';
import { SelectField } from '../SelectField';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  TextField,
} from '../ui';
import { useApiResource } from '../../hooks/useApiResource';
import {
  addressText,
  errorMessage,
  formatDate,
  formatMoney,
  normalizePage,
  prettyStatus,
} from '../../lib/commerce';
import { useAppTheme } from '../../ThemeProvider';

function CustomerFrame({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  const styles = useStyles();
  return (
    <AppShell title={title}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </AppShell>
  );
}

function WishlistSection() {
  const styles = useStyles();
  const loadWishlist = useCallback(() => wishlistApi.list(), []);
  const state = useApiResource(loadWishlist);

  async function remove(productId: number) {
    try {
      await wishlistApi.remove(productId);
      state.reload();
    } catch (error) {
      stateError(error);
    }
  }

  const [actionError, setActionError] = useState('');
  function stateError(error: unknown) {
    setActionError(errorMessage(error));
  }

  return (
    <CustomerFrame
      title="Wishlist"
      subtitle="The pieces you have saved for later."
    >
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && !state.data?.length ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save pieces from the shop and find them here."
        />
      ) : null}
      {(state.data ?? []).map((item) => (
        <Card key={item.id}>
          <Text style={styles.eyebrow}>{prettyStatus(item.productType)}</Text>
          <Text style={styles.cardTitle}>{item.productName}</Text>
          <Text style={styles.price}>{formatMoney(item.basePrice)}</Text>
          <View style={styles.actions}>
            <Button
              title="View product"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/shop/products/[id]',
                  params: { id: String(item.productId) },
                })
              }
            />
            <Button
              title="Remove"
              variant="ghost"
              onPress={() => void remove(item.productId)}
            />
          </View>
        </Card>
      ))}
    </CustomerFrame>
  );
}

function CartSection() {
  const styles = useStyles();
  const loadCart = useCallback(() => cartApi.get(), []);
  const loadAddresses = useCallback(() => addressApi.list(), []);
  const cartState = useApiResource(loadCart);
  const addressState = useApiResource(loadAddresses);
  const [shippingId, setShippingId] = useState('');
  const [billingSame, setBillingSame] = useState(true);
  const [billingId, setBillingId] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const cart = cartState.data;
  const addresses = addressState.data ?? [];
  const defaultAddress =
    addresses.find((address) => address.defaultAddress) ?? addresses[0];
  const chosenShippingId = shippingId || String(defaultAddress?.id ?? '');
  const selectedBillingId = billingId || chosenShippingId;

  async function updateQuantity(variantItemId: number, quantity: number) {
    const item = cart?.items.find(
      (cartItem) => cartItem.variantItemId === variantItemId,
    );
    if (!item || quantity < 1 || quantity > item.availableStock) {
      return;
    }
    setBusyId(variantItemId);
    setActionError('');
    try {
      await cartApi.setQuantity(variantItemId, quantity);
      cartState.reload();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(variantItemId: number) {
    setBusyId(variantItemId);
    setActionError('');
    try {
      await cartApi.remove(variantItemId);
      cartState.reload();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function clearCart() {
    setActionError('');
    try {
      await cartApi.abandon();
      setClearConfirm(false);
      setNotice('Your cart has been cleared.');
      cartState.reload();
    } catch (error) {
      setActionError(errorMessage(error));
    }
  }

  async function checkout() {
    setActionError('');
    setNotice('');
    if (!chosenShippingId) {
      setActionError('Add a delivery address before placing your order.');
      return;
    }
    setCheckoutBusy(true);
    try {
      const order = await cartApi.checkout(
        Number(chosenShippingId),
        billingSame ? null : Number(selectedBillingId) || null,
      );
      router.push({
        pathname: '/account/orders/[id]',
        params: {
          id: String(order.id),
          message: 'Your order has been placed. Payment is not processed online.',
        },
      });
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setCheckoutBusy(false);
    }
  }

  return (
    <CustomerFrame
      title="Your cart"
      subtitle="Review your items before placing your order."
    >
      <Button
        title="Continue shopping"
        variant="ghost"
        onPress={() => router.push('/shop')}
      />
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {cartState.error ? (
        <ErrorState message={cartState.error} onRetry={cartState.reload} />
      ) : null}
      {addressState.error ? (
        <Alert tone="error">
          Addresses could not be loaded: {addressState.error}
        </Alert>
      ) : null}
      {cartState.loading && !cart ? (
        <Card>
          <Text style={styles.muted}>Loading your cart…</Text>
        </Card>
      ) : null}
      {!cartState.loading && !cartState.error && !cart?.items?.length ? (
        <EmptyState
          title="Your cart is empty"
          description="Find something you love in the shop."
        />
      ) : null}
      {(cart?.items ?? []).map((item) => (
        <Card key={item.variantItemId}>
          <Text style={styles.cardTitle}>{item.productName}</Text>
          {item.variantDescription ? (
            <Text style={styles.muted}>{item.variantDescription}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(item.unitPrice)}</Text>
            <Text style={styles.muted}>each</Text>
          </View>
          <Text style={styles.cardTitle}>
            Subtotal: {formatMoney(item.subtotal)}
          </Text>
          {item.quantity > item.availableStock ? (
            <Alert tone="error">
              Only {item.availableStock} available. Adjust the quantity.
            </Alert>
          ) : null}
          {item.availableStock === 0 ? (
            <Alert tone="error">This item is currently out of stock.</Alert>
          ) : null}
          <View style={styles.actions}>
            <Button
              title="−"
              variant="secondary"
              disabled={
                item.quantity <= 1 || busyId === item.variantItemId
              }
              onPress={() =>
                void updateQuantity(item.variantItemId, item.quantity - 1)
              }
            />
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Button
              title="+"
              variant="secondary"
              disabled={
                item.quantity >= item.availableStock ||
                busyId === item.variantItemId
              }
              onPress={() =>
                void updateQuantity(item.variantItemId, item.quantity + 1)
              }
            />
            <Button
              title="Remove"
              variant="ghost"
              busy={busyId === item.variantItemId}
              onPress={() => void removeItem(item.variantItemId)}
            />
          </View>
        </Card>
      ))}
      {cart?.items.length ? (
        <Card>
          <PageTitle title="Order summary" />
          <Text style={styles.cardTitle}>
            Items (
            {cart.items.reduce((sum, item) => sum + item.quantity, 0)})
          </Text>
          <Text style={styles.price}>{formatMoney(cart.total)}</Text>
          <Text style={styles.muted}>Shipping is calculated separately.</Text>
          <Alert tone="info">
            Online payment is not available. Placing an order does not confirm
            payment.
          </Alert>
          {!addresses.length ? (
            <>
              <Alert tone="info">
                Add a delivery address before checkout.
              </Alert>
              <Button
                title="Add delivery address"
                variant="secondary"
                onPress={() => router.push('/account/addresses')}
              />
            </>
          ) : (
            <>
              <SelectField
                label="Delivery address"
                value={chosenShippingId}
                onChange={setShippingId}
                options={addresses.map((address) => ({
                  value: String(address.id),
                  label: `${address.addressType} · ${addressText(address)}`,
                }))}
              />
              <Button
                title={
                  billingSame
                    ? 'Billing same as delivery ✓'
                    : 'Billing same as delivery'
                }
                variant="secondary"
                onPress={() => setBillingSame((value) => !value)}
              />
              {!billingSame ? (
                <SelectField
                  label="Billing address"
                  value={selectedBillingId}
                  onChange={setBillingId}
                  options={addresses.map((address) => ({
                    value: String(address.id),
                    label: `${address.addressType} · ${addressText(address)}`,
                  }))}
                />
              ) : null}
            </>
          )}
          <Button
            title="Place order"
            busy={checkoutBusy}
            disabled={
              !addresses.length ||
              cart.items.some((item) => item.quantity > item.availableStock)
            }
            onPress={() => void checkout()}
          />
          {clearConfirm ? (
            <>
              <Alert tone="info">
                Clear every item from your cart? This cannot be undone.
              </Alert>
              <Button
                title="Confirm clear cart"
                variant="ghost"
                onPress={() => void clearCart()}
              />
              <Button
                title="Keep my items"
                variant="ghost"
                onPress={() => setClearConfirm(false)}
              />
            </>
          ) : (
            <Button
              title="Clear cart"
              variant="ghost"
              onPress={() => setClearConfirm(true)}
            />
          )}
        </Card>
      ) : null}
    </CustomerFrame>
  );
}

type AddressFormState = {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  countryCode: string;
  addressType: string;
};

const EMPTY_ADDRESS: AddressFormState = {
  street: '',
  city: '',
  state: '',
  zipcode: '',
  countryCode: 'EG',
  addressType: 'HOME',
};

function AddressSection() {
  const styles = useStyles();
  const loadAddresses = useCallback(() => addressApi.list(), []);
  const state = useApiResource(loadAddresses);
  const [form, setForm] = useState<AddressFormState>(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function updateForm<K extends keyof AddressFormState>(
    key: K,
    value: AddressFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function editAddress(address: NonNullable<typeof state.data>[number]) {
    setEditingId(address.id);
    setForm({
      street: address.street,
      city: address.city,
      state: address.state ?? '',
      zipcode: address.zipcode ?? '',
      countryCode: address.countryCode,
      addressType: address.addressType,
    });
    setError('');
    setNotice('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_ADDRESS);
  }

  async function saveAddress() {
    setError('');
    setNotice('');
    if (!form.street.trim() || !form.city.trim()) {
      setError('Street address and city are required.');
      return;
    }
    if (!/^[a-z]{2}$/i.test(form.countryCode.trim())) {
      setError('Enter a two-letter country code, for example EG.');
      return;
    }
    setBusy(true);
    const body: AddressPayload = {
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim() || null,
      zipcode: form.zipcode.trim() || null,
      countryCode: form.countryCode.trim().toUpperCase(),
      addressType: form.addressType,
    };
    try {
      if (editingId !== null) {
        await addressApi.update(editingId, body);
        setNotice('Address updated.');
      } else {
        await addressApi.create(body);
        setNotice('Address saved.');
      }
      cancelEdit();
      state.reload();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function addressAction(
    id: number,
    action: (addressId: number) => Promise<void>,
    message: string,
  ) {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      await action(id);
      setConfirmId(null);
      setNotice(message);
      state.reload();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <CustomerFrame
      title="Your addresses"
      subtitle="Manage the delivery addresses you can use at checkout."
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      <PageTitle
        title="Saved addresses"
        subtitle="Your default address is selected first at checkout."
      />
      {!state.loading && !state.error && !state.data?.length ? (
        <EmptyState
          title="No saved addresses"
          description="Add one below to place an order."
        />
      ) : null}
      {(state.data ?? []).map((address) => (
        <Card key={address.id}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{prettyStatus(address.addressType)}</Text>
            {address.defaultAddress ? (
              <Text style={styles.eyebrow}>Default</Text>
            ) : null}
          </View>
          <Text style={styles.muted}>{addressText(address)}</Text>
          <View style={styles.actions}>
            {!address.defaultAddress ? (
              <Button
                title="Make default"
                variant="secondary"
                busy={busyId === address.id}
                onPress={() =>
                  void addressAction(
                    address.id,
                    addressApi.setDefault,
                    'Default address updated.',
                  )
                }
              />
            ) : null}
            <Button
              title="Edit"
              variant="ghost"
              onPress={() => editAddress(address)}
            />
            {confirmId === address.id ? (
              <Button
                title="Confirm remove"
                variant="ghost"
                busy={busyId === address.id}
                onPress={() =>
                  void addressAction(
                    address.id,
                    addressApi.remove,
                    'Address removed.',
                  )
                }
              />
            ) : (
              <Button
                title="Remove"
                variant="ghost"
                onPress={() => setConfirmId(address.id)}
              />
            )}
          </View>
        </Card>
      ))}
      <Card>
        <PageTitle
          title={editingId !== null ? 'Edit address' : 'Add an address'}
          subtitle="Enter the address exactly as it should appear on a delivery label."
        />
        <TextField
          label="Street address"
          value={form.street}
          onChangeText={(value) => updateForm('street', value)}
          maxLength={255}
          autoCapitalize="words"
        />
        <TextField
          label="City"
          value={form.city}
          onChangeText={(value) => updateForm('city', value)}
          maxLength={100}
          autoCapitalize="words"
        />
        <TextField
          label="State / region (optional)"
          value={form.state}
          onChangeText={(value) => updateForm('state', value)}
          maxLength={100}
          autoCapitalize="words"
        />
        <TextField
          label="Postal code (optional)"
          value={form.zipcode}
          onChangeText={(value) => updateForm('zipcode', value)}
          maxLength={20}
        />
        <TextField
          label="Country code"
          value={form.countryCode}
          onChangeText={(value) => updateForm('countryCode', value)}
          hint="Two letters, for example EG"
          maxLength={2}
          autoCapitalize="characters"
        />
        <SelectField
          label="Address type"
          value={form.addressType}
          onChange={(value) => updateForm('addressType', value)}
          options={[
            { value: 'HOME', label: 'Home' },
            { value: 'WORK', label: 'Work' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
        <Button
          title={editingId !== null ? 'Save changes' : 'Save address'}
          busy={busy}
          onPress={() => void saveAddress()}
        />
        {editingId !== null ? (
          <Button
            title="Cancel edit"
            variant="ghost"
            onPress={cancelEdit}
          />
        ) : null}
      </Card>
    </CustomerFrame>
  );
}

function OrdersSection() {
  const styles = useStyles();
  const [page, setPage] = useState(0);
  const loadOrders = useCallback(() => orderApi.list(page, 10), [page]);
  const state = useApiResource(loadOrders);
  const orders = normalizePage(state.data);

  return (
    <CustomerFrame
      title="Your orders"
      subtitle="See what you have ordered and follow its delivery progress."
    >
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && !orders.items.length ? (
        <EmptyState
          title="No orders yet"
          description="Your placed orders will appear here."
        />
      ) : null}
      {orders.items.map((order) => (
        <Card key={order.id}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Order #{order.id}</Text>
            <Text style={styles.eyebrow}>{prettyStatus(order.status)}</Text>
          </View>
          <Text style={styles.muted}>Placed {formatDate(order.createdAt)}</Text>
          <Text style={styles.muted}>
            Items: {order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
          </Text>
          <Text style={styles.price}>{formatMoney(order.totalPrice)}</Text>
          <Text style={styles.muted}>
            Shipment: {prettyStatus(order.shipment?.status)}
          </Text>
          <Text style={styles.muted}>
            Payment: {prettyStatus(order.paymentStatus)}
          </Text>
          <Button
            title="View order"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/account/orders/[id]',
                params: { id: String(order.id) },
              })
            }
          />
        </Card>
      ))}
      <Pagination
        page={orders.page}
        totalPages={orders.totalPages}
        onChange={setPage}
      />
    </CustomerFrame>
  );
}

function OrderDetailSection() {
  const styles = useStyles();
  const { id: routeId, message } = useLocalSearchParams<{
    id?: string;
    message?: string;
  }>();
  const orderId =
    typeof routeId === 'string' && /^\d+$/.test(routeId)
      ? Number(routeId)
      : null;
  const loadOrder = useCallback(() => {
    if (orderId === null) {
      throw new Error('Invalid order link.');
    }
    return orderApi.get(orderId);
  }, [orderId]);
  const state = useApiResource(loadOrder);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState(
    typeof message === 'string' ? message : '',
  );
  const order = state.data;

  async function cancelOrder() {
    if (!order) {
      return;
    }
    setBusy(true);
    setActionError('');
    setNotice('');
    try {
      await orderApi.cancel(order.id);
      setConfirmCancel(false);
      setNotice('Order cancelled. Reserved stock has been released.');
      state.reload();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerFrame
      title={order ? `Order #${order.id}` : 'Order details'}
      subtitle={
        order
          ? `Placed ${formatDate(order.createdAt)}`
          : 'View items, delivery, and order status.'
      }
    >
      <Button
        title="Back to orders"
        variant="ghost"
        onPress={() => router.push('/account/orders')}
      />
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {state.loading && !order ? (
        <Card>
          <Text style={styles.muted}>Loading order…</Text>
        </Card>
      ) : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {order ? (
        <>
          <Card>
            <PageTitle title="Items" subtitle="Prices recorded when ordered." />
            {order.items?.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{item.productName}</Text>
                  {item.variantDescription ? (
                    <Text style={styles.muted}>{item.variantDescription}</Text>
                  ) : null}
                </View>
                <Text style={styles.muted}>
                  {item.quantity} × {formatMoney(item.priceAtPurchase)}
                </Text>
              </View>
            ))}
            <Text style={styles.price}>
              Total · {order.currencyCode}: {formatMoney(order.totalPrice)}
            </Text>
          </Card>
          <Card>
            <PageTitle
              title="Delivery & shipment"
              subtitle="Shipment details are updated as your order moves through fulfillment."
            />
            <Fact label="Order status" value={prettyStatus(order.status)} />
            <Fact
              label="Shipment status"
              value={prettyStatus(order.shipment?.status)}
            />
            <Fact
              label="Carrier"
              value={order.shipment?.carrier || 'Not assigned yet'}
            />
            <Fact
              label="Tracking number"
              value={order.shipment?.trackingNumber || 'Not assigned yet'}
            />
            <Fact
              label="Expected delivery"
              value={formatDate(order.shipment?.expectedDeliveryAt)}
            />
            <Fact
              label="Delivered"
              value={
                order.shipment?.delivered
                  ? formatDate(order.shipment.actualDeliveryAt)
                  : 'Not delivered'
              }
            />
            <Text style={styles.cardTitle}>Ship to</Text>
            <Text style={styles.muted}>
              {order.shippingAddress
                ? addressText(order.shippingAddress)
                : 'No longer available'}
            </Text>
            <Text style={styles.cardTitle}>Bill to</Text>
            <Text style={styles.muted}>
              {order.billingAddress
                ? addressText(order.billingAddress)
                : 'No longer available'}
            </Text>
          </Card>
          <Card>
            <PageTitle
              title="Payment"
              subtitle="Online payment is not available yet."
            />
            <Text style={styles.cardTitle}>
              Payment status: {prettyStatus(order.paymentStatus)}
            </Text>
          </Card>
          {order.status === 'PENDING' ? (
            confirmCancel ? (
              <Card>
                <Alert tone="info">
                  Cancel this order? This action cannot be undone.
                </Alert>
                <Button
                  title="Confirm cancellation"
                  busy={busy}
                  onPress={() => void cancelOrder()}
                />
                <Button
                  title="Keep order"
                  variant="ghost"
                  onPress={() => setConfirmCancel(false)}
                />
              </Card>
            ) : (
              <Button
                title="Cancel order"
                variant="ghost"
                onPress={() => setConfirmCancel(true)}
              />
            )
          ) : null}
        </>
      ) : null}
    </CustomerFrame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function ProfileSection() {
  const styles = useStyles();
  const { user, updateUser } = useSession();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [image, setImage] = useState(user?.image ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const dirty =
    firstName.trim() !== user?.firstName ||
    lastName.trim() !== user?.lastName ||
    phone.trim() !== (user?.phone ?? '') ||
    image.trim() !== (user?.image ?? '');

  async function saveProfile() {
    setError('');
    setSaved(false);
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (phone.trim() && !/^[+()\d\s.-]{7,20}$/.test(phone.trim())) {
      setError('Enter a valid phone number.');
      return;
    }
    if (image.trim() && !/^https?:\/\//i.test(image.trim())) {
      setError('Photo link must start with http:// or https://.');
      return;
    }
    setBusy(true);
    try {
      const updated = await userApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        image: image.trim(),
      });
      updateUser(updated);
      setSaved(true);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerFrame
      title="Your profile"
      subtitle="Details shown on your orders and used when we contact you."
    >
      <Card>
        <Text style={styles.eyebrow}>MEMBER SINCE</Text>
        <Text style={styles.cardTitle}>{formatDate(user?.registerDate)}</Text>
        <Text style={styles.muted}>{user?.email}</Text>
        {user?.phone ? <Text style={styles.muted}>{user.phone}</Text> : null}
      </Card>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Profile saved.</Alert> : null}
      <Card>
        <PageTitle title="Your details" />
        <TextField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          maxLength={100}
        />
        <TextField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          maxLength={100}
        />
        <TextField
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={20}
        />
        <TextField
          label="Photo link (optional)"
          value={image}
          onChangeText={setImage}
          keyboardType="url"
          hint="A public image address (https://…)"
          autoCapitalize="none"
        />
        <Button
          title="Save changes"
          busy={busy}
          disabled={!dirty}
          onPress={() => void saveProfile()}
        />
      </Card>
      <Button
        title="Security settings"
        variant="secondary"
        onPress={() => router.push('/account/security')}
      />
      <Button
        title="Appearance"
        variant="secondary"
        onPress={() => router.push('/account/appearance')}
      />
    </CustomerFrame>
  );
}

function SecuritySection() {
  const { logout, setNotice } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function changePassword() {
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Complete all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a password you have not used here before.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      await logout();
      setNotice('Password changed. Log in with your new password.');
      router.replace('/login');
    } catch (requestError) {
      setError(errorMessage(requestError));
      setBusy(false);
    }
  }

  return (
    <CustomerFrame
      title="Security"
      subtitle="Keep your account safe."
    >
      <Card>
        <PageTitle
          title="Change password"
          subtitle="Changing it signs out every device, including this one."
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        <TextField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
          hint="Use at least 8 characters."
        />
        <TextField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Button
          title="Change password"
          busy={busy}
          onPress={() => void changePassword()}
        />
      </Card>
    </CustomerFrame>
  );
}

type PaymentForm = Omit<PaymentMethodPayload, 'expiryMonth' | 'expiryYear'> & {
  expiryMonth: string;
  expiryYear: string;
};

const EMPTY_PAYMENT: PaymentForm = {
  provider: 'PAYMOB',
  providerToken: '',
  cardBrand: 'VISA',
  last4: '',
  expiryMonth: '',
  expiryYear: '',
  makeDefault: false,
};

function isDefaultPayment(method: PaymentMethod) {
  return Boolean(method.isDefault ?? method.default ?? method.defaultMethod);
}

function isExpiredPayment(method: PaymentMethod) {
  if (typeof method.expired === 'boolean') {
    return method.expired;
  }
  const now = new Date();
  return (
    method.expiryYear < now.getFullYear() ||
    (method.expiryYear === now.getFullYear() &&
      method.expiryMonth < now.getMonth() + 1)
  );
}

function PaymentSection() {
  const styles = useStyles();
  const loadMethods = useCallback(() => userApi.listPaymentMethods(), []);
  const state = useApiResource(loadMethods);
  const methods = normalizePage(state.data).items;
  const [form, setForm] = useState<PaymentForm>(EMPTY_PAYMENT);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function updateForm<K extends keyof PaymentForm>(
    key: K,
    value: PaymentForm[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function addMethod() {
    setError('');
    setNotice('');
    const year = new Date().getFullYear();
    const month = Number(form.expiryMonth);
    const expiryYear = Number(form.expiryYear);
    if (!form.providerToken.trim()) {
      setError('Enter the payment provider token.');
      return;
    }
    if (!/^\d{4}$/.test(form.last4)) {
      setError('Last 4 digits must contain exactly four numbers.');
      return;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setError('Expiry month must be between 1 and 12.');
      return;
    }
    if (
      !Number.isInteger(expiryYear) ||
      expiryYear < year ||
      expiryYear > year + 30
    ) {
      setError(`Expiry year must be between ${year} and ${year + 30}.`);
      return;
    }
    setBusy(true);
    try {
      const payload: PaymentMethodPayload = {
        ...form,
        providerToken: form.providerToken.trim(),
        last4: form.last4,
        expiryMonth: month,
        expiryYear,
      };
      await userApi.addPaymentMethod(payload);
      setForm(EMPTY_PAYMENT);
      setNotice('Payment method saved.');
      state.reload();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function paymentAction(
    id: number,
    action: (methodId: number) => Promise<void>,
  ) {
    setBusyId(id);
    setError('');
    try {
      await action(id);
      setConfirmId(null);
      state.reload();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <CustomerFrame
      title="Payment methods"
      subtitle="Manage secure payment-provider tokens saved to your account."
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && !methods.length ? (
        <EmptyState
          title="No payment methods yet"
          description="Add a provider token below."
        />
      ) : null}
      {methods.map((method) => (
        <Card key={method.id}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{method.cardBrand}</Text>
            {isDefaultPayment(method) ? (
              <Text style={styles.eyebrow}>Default</Text>
            ) : null}
          </View>
          <Text style={styles.cardTitle}>•••• •••• •••• {method.last4}</Text>
          <Text style={styles.muted}>
            Expires {String(method.expiryMonth).padStart(2, '0')}/
            {method.expiryYear} · {method.provider}
          </Text>
          {isExpiredPayment(method) ? (
            <Alert tone="error">This method has expired.</Alert>
          ) : null}
          <View style={styles.actions}>
            {!isDefaultPayment(method) && !isExpiredPayment(method) ? (
              <Button
                title="Make default"
                variant="secondary"
                busy={busyId === method.id}
                onPress={() =>
                  void paymentAction(
                    method.id,
                    userApi.makeDefaultPaymentMethod,
                  )
                }
              />
            ) : null}
            {confirmId === method.id ? (
              <>
                <Button
                  title="Confirm remove"
                  busy={busyId === method.id}
                  onPress={() =>
                    void paymentAction(method.id, userApi.removePaymentMethod)
                  }
                />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setConfirmId(null)}
                />
              </>
            ) : (
              <Button
                title="Remove"
                variant="ghost"
                onPress={() => setConfirmId(method.id)}
              />
            )}
          </View>
        </Card>
      ))}
      <Card>
        <PageTitle
          title="Add a method"
          subtitle="Only enter a token supplied by your payment provider. Never enter a full card number here."
        />
        <SelectField
          label="Provider"
          value={form.provider}
          onChange={(value) => updateForm('provider', value)}
          options={['PAYMOB', 'STRIPE', 'PAYPAL'].map((value) => ({
            value,
            label: value,
          }))}
        />
        <SelectField
          label="Card brand"
          value={form.cardBrand}
          onChange={(value) => updateForm('cardBrand', value)}
          options={['VISA', 'MASTERCARD', 'MEEZA', 'AMEX', 'OTHER'].map(
            (value) => ({ value, label: value }),
          )}
        />
        <TextField
          label="Provider token"
          value={form.providerToken}
          onChangeText={(value) => updateForm('providerToken', value)}
          autoComplete="off"
        />
        <TextField
          label="Last 4 digits"
          value={form.last4}
          onChangeText={(value) => updateForm('last4', value.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={4}
          autoComplete="off"
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Expiry month"
              value={form.expiryMonth}
              onChangeText={(value) =>
                updateForm('expiryMonth', value.replace(/\D/g, ''))
              }
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Expiry year"
              value={form.expiryYear}
              onChangeText={(value) =>
                updateForm('expiryYear', value.replace(/\D/g, ''))
              }
              keyboardType="number-pad"
              maxLength={4}
              placeholder="YYYY"
            />
          </View>
        </View>
        <Button
          title={
            form.makeDefault
              ? '✓ Use as my default method'
              : 'Use as my default method'
          }
          variant="secondary"
          onPress={() =>
            updateForm('makeDefault', !form.makeDefault)
          }
        />
        <Button
          title="Save payment method"
          busy={busy}
          onPress={() => void addMethod()}
        />
        <Alert tone="info">
          Saved methods are not used to process checkout payments in this app.
        </Alert>
      </Card>
    </CustomerFrame>
  );
}

function FeedbackSection() {
  const styles = useStyles();
  const [page, setPage] = useState(0);
  const loadFeedback = useCallback(() => userApi.myFeedback(page), [page]);
  const state = useApiResource(loadFeedback);
  const feedback = normalizePage(state.data);
  const [text, setText] = useState('');
  const [satisfaction, setSatisfaction] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function sendFeedback() {
    setError('');
    setSent(false);
    if (!text.trim()) {
      setError('Write a few words before sending.');
      return;
    }
    setBusy(true);
    try {
      await userApi.sendFeedback({
        text: text.trim(),
        satisfied:
          satisfaction === ''
            ? null
            : satisfaction === 'yes',
      });
      setText('');
      setSent(true);
      if (page === 0) {
        state.reload();
      } else {
        setPage(0);
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerFrame
      title="Feedback"
      subtitle="Tell us what is working and what is not."
    >
      <Card>
        <PageTitle
          title="Send feedback"
          subtitle="Our team reads every message."
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        {sent ? (
          <Alert tone="success">Thanks, we got your feedback.</Alert>
        ) : null}
        <SelectField
          label="How was your experience?"
          value={satisfaction}
          onChange={setSatisfaction}
          options={[
            { value: '', label: 'Prefer not to say' },
            { value: 'yes', label: 'Satisfied' },
            { value: 'no', label: 'Not satisfied' },
          ]}
        />
        <TextField
          label="Your message"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          hint={`${text.length} / 2000`}
        />
        <Button
          title="Send feedback"
          busy={busy}
          onPress={() => void sendFeedback()}
        />
      </Card>
      <PageTitle title="Your previous messages" />
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && !feedback.items.length ? (
        <EmptyState
          title="Nothing sent yet"
          description="Your messages will show up here."
        />
      ) : null}
      {feedback.items.map((item) => (
        <Card key={item.id}>
          <Text style={styles.muted}>{formatDate(item.createdAt)}</Text>
          {item.satisfied === true ? (
            <Text style={styles.eyebrow}>Satisfied</Text>
          ) : item.satisfied === false ? (
            <Text style={styles.eyebrow}>Not satisfied</Text>
          ) : null}
          <Text style={styles.description}>{item.text}</Text>
        </Card>
      ))}
      <Pagination
        page={feedback.page}
        totalPages={feedback.totalPages}
        onChange={setPage}
      />
    </CustomerFrame>
  );
}

export const CUSTOMER_SECTIONS = {
  wishlist: WishlistSection,
  cart: CartSection,
  orders: OrdersSection,
  profile: ProfileSection,
  addresses: AddressSection,
  payments: PaymentSection,
  security: SecuritySection,
  feedback: FeedbackSection,
};

export { OrderDetailSection };

function useStyles() {
  const { theme } = useAppTheme();
  return useMemo(() => createStyles(theme), [theme]);
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  cardTitle: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  eyebrow: {
    color: theme.colors.leafDeep,
    fontSize: 12,
    fontWeight: '700',
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  price: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantity: {
    minWidth: 32,
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  orderItem: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  fact: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  factLabel: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  factValue: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    textAlign: 'right',
  },
  });
}
