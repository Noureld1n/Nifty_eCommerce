import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adminCatalogApi, adminPromotionApi } from '../../api/adminCommerceApi';
import type { AdminPromotion, PromotionPayload } from '../../api/adminTypes';
import { useApiResource } from '../../hooks/useApiResource';
import {
  errorMessage,
  formatDate,
  formatMoney,
  normalizePage,
} from '../../lib/commerce';
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
import { useAppTheme } from '../../ThemeProvider';

type PromotionForm = {
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: string;
  startDate: string;
  endDate: string;
  categoryIds: string;
  productIds: string;
};

const EMPTY: PromotionForm = {
  name: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  startDate: '',
  endDate: '',
  categoryIds: '',
  productIds: '',
};

function toLocalDate(value?: string) {
  return value ? value.slice(0, 16) : '';
}

function parseIds(value: string) {
  const entries = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (entries.some((item) => !/^\d+$/.test(item) || Number(item) < 1)) {
    throw new Error('Target IDs must be positive numbers separated by commas.');
  }
  return [...new Set(entries.map(Number))];
}

export function AdminPromotions() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [page, setPage] = useState(0);
  const loadPromotions = useCallback(
    () => adminPromotionApi.list(page, 12),
    [page],
  );
  const loadCategories = useCallback(() => adminCatalogApi.categories(), []);
  const state = useApiResource(loadPromotions);
  const categoriesState = useApiResource(loadCategories);
  const promotions = normalizePage(state.data);
  const [form, setForm] = useState<PromotionForm>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function updateForm<K extends keyof PromotionForm>(
    key: K,
    value: PromotionForm[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function edit(promotion: AdminPromotion) {
    setEditingId(promotion.id);
    setForm({
      name: promotion.name,
      description: promotion.description ?? '',
      discountType:
        promotion.discountType === 'PERCENTAGE'
          ? 'PERCENTAGE'
          : 'FIXED_AMOUNT',
      discountValue: String(promotion.discountValue),
      startDate: toLocalDate(promotion.startDate),
      endDate: toLocalDate(promotion.endDate),
      categoryIds: (promotion.categoryIds ?? []).join(', '),
      productIds: (promotion.productIds ?? []).join(', '),
    });
    setError('');
    setNotice('');
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function save() {
    setError('');
    setNotice('');
    const discountValue = Number(form.discountValue);
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (!form.name.trim()) {
      setError('Promotion name is required.');
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError('Enter a discount greater than zero.');
      return;
    }
    if (
      form.discountType === 'PERCENTAGE' &&
      discountValue > 100
    ) {
      setError('Percentage discounts cannot exceed 100%.');
      return;
    }
    if (
      !form.startDate ||
      !form.endDate ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setError('Enter valid dates and make sure the end is after the start.');
      return;
    }
    setBusy(true);
    try {
      const payload: PromotionPayload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue,
        startDate:
          form.startDate.length === 16
            ? `${form.startDate}:00`
            : form.startDate,
        endDate:
          form.endDate.length === 16 ? `${form.endDate}:00` : form.endDate,
        categoryIds: parseIds(form.categoryIds),
        productIds: parseIds(form.productIds),
      };
      if (editingId !== null) {
        await adminPromotionApi.update(editingId, payload);
      } else {
        await adminPromotionApi.create(payload);
      }
      const message = editingId !== null ? 'Promotion updated.' : 'Promotion created.';
      reset();
      state.reload();
      setNotice(message);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(promotion: AdminPromotion) {
    setBusyId(promotion.id);
    setError('');
    setNotice('');
    try {
      await adminPromotionApi.setActive(promotion.id, !promotion.active);
      state.reload();
      setNotice(
        `Promotion ${promotion.active ? 'deactivated' : 'activated'}.`,
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminFrame
      title="Promotions"
      subtitle="Create and manage discounts for products and categories."
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {categoriesState.error ? (
        <Alert tone="error">
          Categories could not be loaded: {categoriesState.error}
        </Alert>
      ) : null}
      <Card>
        <PageTitle
          title={editingId !== null ? 'Edit promotion' : 'Create promotion'}
          subtitle="No targets means a store-wide discount. Enter category and product IDs separated by commas."
        />
        <TextField
          label="Promotion name"
          value={form.name}
          onChangeText={(value) => updateForm('name', value)}
          maxLength={150}
        />
        <TextField
          label="Description"
          value={form.description}
          onChangeText={(value) => updateForm('description', value)}
          multiline
        />
        <SelectField
          label="Discount type"
          value={form.discountType}
          onChange={(value) =>
            updateForm(
              'discountType',
              value === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
            )
          }
          options={[
            { value: 'PERCENTAGE', label: 'Percentage' },
            { value: 'FIXED_AMOUNT', label: 'Fixed amount (EGP)' },
          ]}
        />
        <TextField
          label={
            form.discountType === 'PERCENTAGE'
              ? 'Percent off'
              : 'Amount off (EGP)'
          }
          value={form.discountValue}
          onChangeText={(value) => updateForm('discountValue', value)}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Starts (local time)"
          value={form.startDate}
          onChangeText={(value) => updateForm('startDate', value)}
          placeholder="YYYY-MM-DDTHH:mm"
          hint="Example: 2026-11-15T10:30"
          autoCapitalize="none"
        />
        <TextField
          label="Ends (local time)"
          value={form.endDate}
          onChangeText={(value) => updateForm('endDate', value)}
          placeholder="YYYY-MM-DDTHH:mm"
          hint="Example: 2026-11-20T23:59"
          autoCapitalize="none"
        />
        <TextField
          label="Category IDs"
          value={form.categoryIds}
          onChangeText={(value) => updateForm('categoryIds', value)}
          hint={
            categoriesState.data?.length
              ? categoriesState.data
                  .map((category) => `${category.name} (${category.id})`)
                  .join(', ')
              : 'Comma-separated IDs; optional.'
          }
          keyboardType="numbers-and-punctuation"
        />
        <TextField
          label="Product IDs"
          value={form.productIds}
          onChangeText={(value) => updateForm('productIds', value)}
          hint="Comma-separated IDs; optional."
          keyboardType="numbers-and-punctuation"
        />
        <Button
          title={editingId !== null ? 'Save promotion' : 'Create promotion'}
          busy={busy}
          onPress={() => void save()}
        />
        {editingId !== null ? (
          <Button title="Cancel edit" variant="ghost" onPress={reset} />
        ) : null}
      </Card>
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      <PageTitle title={`All promotions · ${promotions.total}`} />
      {!state.loading && !state.error && !promotions.items.length ? (
        <EmptyState
          title="No promotions"
          description="Create a promotion above to make an offer available."
        />
      ) : null}
      {promotions.items.map((promotion) => (
        <Card key={promotion.id}>
          <Text style={styles.name}>{promotion.name}</Text>
          <Text style={styles.detail}>
            {promotion.discountType === 'PERCENTAGE'
              ? `${promotion.discountValue}% off`
              : `${formatMoney(promotion.discountValue)} off`}
          </Text>
          <Text style={styles.detail}>
            {promotion.currentlyEffective
              ? 'Currently effective'
              : promotion.active
                ? 'Scheduled or expired'
                : 'Inactive'}
          </Text>
          <Text style={styles.detail}>
            {formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}
          </Text>
          <Text style={styles.detail}>
            Categories: {promotion.categoryIds?.join(', ') || 'All'} · Products:{' '}
            {promotion.productIds?.join(', ') || 'All'}
          </Text>
          {promotion.description ? (
            <Text style={styles.detail}>{promotion.description}</Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              title="Edit"
              variant="secondary"
              onPress={() => edit(promotion)}
            />
            <Button
              title={promotion.active ? 'Deactivate' : 'Activate'}
              variant={promotion.active ? 'ghost' : 'primary'}
              busy={busyId === promotion.id}
              onPress={() => void toggle(promotion)}
            />
          </View>
        </Card>
      ))}
      <Pagination
        page={promotions.page}
        totalPages={promotions.totalPages}
        onChange={setPage}
      />
    </AdminFrame>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  name: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  detail: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  });
}
