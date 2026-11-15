import { useCallback, useMemo, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { adminOrderApi } from '../../api/adminCommerceApi';
import type { AdminOrder, ShipmentPayload } from '../../api/adminTypes';
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
import { AdminFrame } from './AdminCommon';

const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
const PAYMENT_STATUSES = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
];
const SHIPMENT_STATUSES = [
  'PENDING',
  'PREPARING',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNED',
];

type ShipmentForm = {
  status: string;
  trackingNumber: string;
  carrier: string;
  expectedDeliveryAt: string;
};

function shipmentForm(order: AdminOrder): ShipmentForm {
  return {
    status: order.shipment?.status ?? 'PENDING',
    trackingNumber: order.shipment?.trackingNumber ?? '',
    carrier: order.shipment?.carrier ?? '',
    expectedDeliveryAt: order.shipment?.expectedDeliveryAt?.slice(0, 16) ?? '',
  };
}

export function AdminOrders() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const loadOrders = useCallback(
    () =>
      adminOrderApi.list({
        status: statusFilter,
        paymentStatus: paymentFilter,
        page,
        size: 12,
      }),
    [statusFilter, paymentFilter, page],
  );
  const state = useApiResource(loadOrders);
  const orders = normalizePage(state.data);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [shipment, setShipment] = useState<ShipmentForm>({
    status: 'PENDING',
    trackingNumber: '',
    carrier: '',
    expectedDeliveryAt: '',
  });
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function selectOrder(order: AdminOrder) {
    setLoadingId(order.id);
    setError('');
    setNotice('');
    try {
      const detail = await adminOrderApi.get(order.id);
      setSelectedOrder(detail);
      setOrderStatus(detail.status);
      setPaymentStatus(detail.paymentStatus);
      setShipment(shipmentForm(detail));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoadingId(null);
    }
  }

  async function update(action: () => Promise<unknown>, message: string) {
    if (!selectedOrder) {
      return;
    }
    setActionBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      const updated = await adminOrderApi.get(selectedOrder.id);
      setSelectedOrder(updated);
      setOrderStatus(updated.status);
      setPaymentStatus(updated.paymentStatus);
      setShipment(shipmentForm(updated));
      setNotice(message);
      state.reload();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setActionBusy(false);
    }
  }

  async function saveShipment() {
    if (!selectedOrder) {
      return;
    }
    const payload: ShipmentPayload = {
      status: shipment.status,
      trackingNumber: shipment.trackingNumber.trim() || null,
      carrier: shipment.carrier.trim() || null,
      expectedDeliveryAt: shipment.expectedDeliveryAt
        ? shipment.expectedDeliveryAt.length === 16
          ? `${shipment.expectedDeliveryAt}:00`
          : shipment.expectedDeliveryAt
        : null,
    };
    await update(
      () => adminOrderApi.updateShipment(selectedOrder.id, payload),
      'Shipment updated.',
    );
  }

  return (
    <AdminFrame
      title="Orders"
      subtitle="Review customer orders and update fulfillment, payment, and shipment statuses."
    >
      <SelectField
        label="Order status"
        value={statusFilter}
        onChange={(value) => {
          setPage(0);
          setStatusFilter(value);
        }}
        options={[
          { value: '', label: 'All statuses' },
          ...ORDER_STATUSES.map((value) => ({
            value,
            label: prettyStatus(value),
          })),
        ]}
      />
      <SelectField
        label="Payment status"
        value={paymentFilter}
        onChange={(value) => {
          setPage(0);
          setPaymentFilter(value);
        }}
        options={[
          { value: '', label: 'All payment statuses' },
          ...PAYMENT_STATUSES.map((value) => ({
            value,
            label: prettyStatus(value),
          })),
        ]}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && orders.items.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Orders matching these filters will appear here."
        />
      ) : null}
      {orders.items.map((order) => (
        <Card key={order.id}>
          <View style={styles.row}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <Text style={styles.badge}>{prettyStatus(order.status)}</Text>
          </View>
          <Text style={styles.title}>{order.customerName}</Text>
          <Text style={styles.muted}>{order.customerEmail}</Text>
          <Text style={styles.muted}>{formatDate(order.createdAt)}</Text>
          <Text style={styles.price}>{formatMoney(order.totalPrice)}</Text>
          <Text style={styles.muted}>
            Payment: {prettyStatus(order.paymentStatus)}
          </Text>
          <Button
            title={selectedOrder?.id === order.id ? 'Selected' : 'Manage'}
            variant="secondary"
            busy={loadingId === order.id}
            onPress={() => void selectOrder(order)}
          />
        </Card>
      ))}
      <Pagination
        page={orders.page}
        totalPages={orders.totalPages}
        onChange={(value) => {
          setSelectedOrder(null);
          setPage(value);
        }}
      />
      {selectedOrder ? (
        <View style={styles.detailSection}>
          <PageTitle
            title={`Manage order #${selectedOrder.id}`}
            subtitle={`${selectedOrder.customerName} · ${selectedOrder.customerEmail}`}
          />
          <Card>
            <PageTitle title="Items" />
            {(selectedOrder.items ?? []).map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.title}>{item.productName}</Text>
                  <Text style={styles.muted}>
                    {item.variantDescription || 'Standard variant'}
                  </Text>
                </View>
                <Text style={styles.muted}>
                  × {item.quantity} · {formatMoney(item.priceAtPurchase)}
                </Text>
              </View>
            ))}
            <Text style={styles.price}>
              {formatMoney(selectedOrder.totalPrice)}{' '}
              {selectedOrder.currencyCode}
            </Text>
            <Text style={styles.muted}>
              Ship to:{' '}
              {selectedOrder.shippingAddress
                ? addressText(selectedOrder.shippingAddress)
                : '—'}
            </Text>
            <Text style={styles.muted}>
              Bill to:{' '}
              {selectedOrder.billingAddress
                ? addressText(selectedOrder.billingAddress)
                : '—'}
            </Text>
          </Card>
          <Card>
            <PageTitle title="Order status" />
            <SelectField
              label="Set status"
              value={orderStatus}
              onChange={setOrderStatus}
              options={ORDER_STATUSES.map((value) => ({
                value,
                label: prettyStatus(value),
              }))}
            />
            <Button
              title="Update order status"
              busy={actionBusy}
              disabled={orderStatus === selectedOrder.status}
              onPress={() =>
                void update(
                  () =>
                    adminOrderApi.setStatus(
                      selectedOrder.id,
                      orderStatus,
                    ),
                  'Order status updated.',
                )
              }
            />
            <SelectField
              label="Payment status"
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={PAYMENT_STATUSES.map((value) => ({
                value,
                label: prettyStatus(value),
              }))}
            />
            <Button
              title="Update payment status"
              variant="secondary"
              busy={actionBusy}
              disabled={paymentStatus === selectedOrder.paymentStatus}
              onPress={() =>
                void update(
                  () =>
                    adminOrderApi.setPaymentStatus(
                      selectedOrder.id,
                      paymentStatus,
                    ),
                  'Payment status updated.',
                )
              }
            />
            <Alert tone="info">
              Payment status is an administrative record; this update does not
              process a payment.
            </Alert>
          </Card>
          <Card>
            <PageTitle title="Shipment" />
            <SelectField
              label="Shipment status"
              value={shipment.status}
              onChange={(value) =>
                setShipment((previous) => ({ ...previous, status: value }))
              }
              options={SHIPMENT_STATUSES.map((value) => ({
                value,
                label: prettyStatus(value),
              }))}
            />
            <TextField
              label="Carrier"
              value={shipment.carrier}
              onChangeText={(value) =>
                setShipment((previous) => ({ ...previous, carrier: value }))
              }
              maxLength={100}
            />
            <TextField
              label="Tracking number"
              value={shipment.trackingNumber}
              onChangeText={(value) =>
                setShipment((previous) => ({
                  ...previous,
                  trackingNumber: value,
                }))
              }
              maxLength={150}
            />
            <TextField
              label="Expected delivery (local time)"
              value={shipment.expectedDeliveryAt}
              onChangeText={(value) =>
                setShipment((previous) => ({
                  ...previous,
                  expectedDeliveryAt: value,
                }))
              }
              placeholder="YYYY-MM-DDTHH:mm"
            />
            <Button
              title="Save shipment"
              busy={actionBusy}
              onPress={() => void saveShipment()}
            />
            {selectedOrder.shipment?.delivered ? (
              <Text style={styles.muted}>
                Delivered {formatDate(selectedOrder.shipment.actualDeliveryAt)}
              </Text>
            ) : null}
          </Card>
        </View>
      ) : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
    </AdminFrame>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    color: theme.colors.leafDeep,
    fontSize: 12,
    fontWeight: '700',
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  price: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  detailSection: {
    gap: 12,
  },
  itemRow: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  itemInfo: {
    flex: 1,
  },
  });
}
