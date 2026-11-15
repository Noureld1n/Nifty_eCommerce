import { useCallback, useMemo, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { adminCatalogApi, adminProcurementApi } from '../../api/adminCommerceApi';
import type {
  AdminProduct,
  ProcurementContact,
  ProcurementContactPayload,
  ProcurementPackageItemPayload,
} from '../../api/adminTypes';
import { useApiResource } from '../../hooks/useApiResource';
import {
  errorMessage,
  formatDate,
  formatMoney,
  normalizePage,
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

type ContactForm = {
  name: string;
  email: string;
  phone: string;
};

const EMPTY_CONTACT: ContactForm = { name: '', email: '', phone: '' };
type ContactKind = 'provider' | 'accountable';

function contactPayload(form: ContactForm): ProcurementContactPayload {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
  };
}

function variantLabel(variant: NonNullable<AdminProduct['variants']>[number]) {
  return [
    variant.size,
    variant.color,
    variant.material,
    variant.sizeLabel,
    variant.volumeMl ? `${variant.volumeMl} ml` : null,
    variant.formulation,
    variant.additionalDescription,
  ]
    .filter(Boolean)
    .join(' · ') || 'Standard';
}

export function AdminProcurement() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const loadProviders = useCallback(() => adminProcurementApi.providers(), []);
  const loadAccountables = useCallback(
    () => adminProcurementApi.accountables(),
    [],
  );
  const loadProducts = useCallback(
    () => adminCatalogApi.products({ active: 'true', page: 0, size: 100 }),
    [],
  );
  const [packagePage, setPackagePage] = useState(0);
  const loadPackages = useCallback(
    () => adminProcurementApi.packages(packagePage, 10),
    [packagePage],
  );
  const providersState = useApiResource(loadProviders);
  const accountablesState = useApiResource(loadAccountables);
  const productsState = useApiResource(loadProducts);
  const packagesState = useApiResource(loadPackages);
  const providers = providersState.data ?? [];
  const accountables = accountablesState.data ?? [];
  const products = normalizePage(productsState.data).items;
  const packages = normalizePage(packagesState.data);
  const activeVariants = useMemo(
    () =>
      products.flatMap((product) =>
        (product.variants ?? [])
          .filter((variant) => variant.active)
          .map((variant) => ({
            ...variant,
            productName: product.name,
          })),
      ),
    [products],
  );

  const [providerForm, setProviderForm] = useState<ContactForm>(EMPTY_CONTACT);
  const [accountableForm, setAccountableForm] =
    useState<ContactForm>(EMPTY_CONTACT);
  const [providerEditId, setProviderEditId] = useState<number | null>(null);
  const [accountableEditId, setAccountableEditId] = useState<number | null>(
    null,
  );
  const [receipt, setReceipt] = useState({
    providerId: '',
    accountableId: '',
    purchaseDate: '',
    referenceNumber: '',
    notes: '',
  });
  const [lineForm, setLineForm] = useState({
    variantItemId: '',
    quantity: '1',
    unitCost: '0',
    notes: '',
  });
  const [lines, setLines] = useState<ProcurementPackageItemPayload[]>([]);
  const [lineLabels, setLineLabels] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function editContact(kind: ContactKind, contact: ProcurementContact) {
    const form = {
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
    };
    if (kind === 'provider') {
      setProviderEditId(contact.id);
      setProviderForm(form);
    } else {
      setAccountableEditId(contact.id);
      setAccountableForm(form);
    }
    setError('');
    setNotice('');
  }

  async function saveContact(kind: ContactKind) {
    const isProvider = kind === 'provider';
    const form = isProvider ? providerForm : accountableForm;
    const id = isProvider ? providerEditId : accountableEditId;
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = contactPayload(form);
      if (isProvider) {
        if (id !== null) await adminProcurementApi.updateProvider(id, payload);
        else await adminProcurementApi.createProvider(payload);
        providersState.reload();
        setProviderForm(EMPTY_CONTACT);
        setProviderEditId(null);
      } else {
        if (id !== null) {
          await adminProcurementApi.updateAccountable(id, payload);
        } else {
          await adminProcurementApi.createAccountable(payload);
        }
        accountablesState.reload();
        setAccountableForm(EMPTY_CONTACT);
        setAccountableEditId(null);
      }
      setNotice(`${isProvider ? 'Provider' : 'Accountable'} saved.`);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function toggleContact(kind: ContactKind, contact: ProcurementContact) {
    const key = `${kind}-${contact.id}`;
    setBusyId(key);
    setError('');
    setNotice('');
    try {
      if (kind === 'provider') {
        await adminProcurementApi.setProviderActive(
          contact.id,
          !contact.active,
        );
        providersState.reload();
      } else {
        await adminProcurementApi.setAccountableActive(
          contact.id,
          !contact.active,
        );
        accountablesState.reload();
      }
      setNotice(
        `${kind === 'provider' ? 'Provider' : 'Accountable'} ${
          contact.active ? 'deactivated' : 'activated'
        }.`,
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  }

  function addReceiptLine() {
    setError('');
    const variant = activeVariants.find(
      (item) => String(item.variantItemId) === lineForm.variantItemId,
    );
    const quantity = Number(lineForm.quantity);
    const unitCost = Number(lineForm.unitCost);
    if (!variant) {
      setError('Choose an active product variant.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Quantity must be a positive whole number.');
      return;
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setError('Unit cost cannot be negative.');
      return;
    }
    if (lines.some((line) => line.variantItemId === variant.variantItemId)) {
      setError('Each variant can appear only once in a package.');
      return;
    }
    setLines((previous) => [
      ...previous,
      {
        variantItemId: variant.variantItemId,
        quantity,
        unitCost,
        notes: lineForm.notes.trim() || null,
      },
    ]);
    setLineLabels((previous) => ({
      ...previous,
      [variant.variantItemId]: `${variant.productName} · ${variantLabel(variant)}`,
    }));
    setLineForm({
      variantItemId: '',
      quantity: '1',
      unitCost: '0',
      notes: '',
    });
  }

  async function receivePackage() {
    if (!receipt.providerId || !receipt.accountableId) {
      setError('Choose a provider and accountable staff member.');
      return;
    }
    if (!lines.length) {
      setError('Add at least one product variant to receive stock.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await adminProcurementApi.receivePackage({
        providerId: Number(receipt.providerId),
        accountableId: Number(receipt.accountableId),
        purchaseDate: receipt.purchaseDate
          ? receipt.purchaseDate.length === 16
            ? `${receipt.purchaseDate}:00`
            : receipt.purchaseDate
          : null,
        referenceNumber: receipt.referenceNumber.trim() || null,
        notes: receipt.notes.trim() || null,
        items: lines,
      });
      setLines([]);
      setLineLabels({});
      setReceipt({
        providerId: '',
        accountableId: '',
        purchaseDate: '',
        referenceNumber: '',
        notes: '',
      });
      packagesState.reload();
      productsState.reload();
      setNotice('Stock receipt saved and inventory updated.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  function renderContacts(
    kind: ContactKind,
    contacts: ProcurementContact[],
    form: ContactForm,
    setForm: (updater: (previous: ContactForm) => ContactForm) => void,
    editingId: number | null,
    cancelEdit: () => void,
  ) {
    const label = kind === 'provider' ? 'Provider' : 'Accountable';
    return (
      <Card>
        <PageTitle
          title={`${label}s`}
          subtitle={
            kind === 'provider'
              ? 'Suppliers used for incoming stock.'
              : 'Staff responsible for receiving stock.'
          }
        />
        <TextField
          label="Name"
          value={form.name}
          onChangeText={(value) =>
            setForm((previous) => ({ ...previous, name: value }))
          }
          maxLength={150}
        />
        <TextField
          label="Email"
          value={form.email}
          onChangeText={(value) =>
            setForm((previous) => ({ ...previous, email: value }))
          }
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={150}
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChangeText={(value) =>
            setForm((previous) => ({ ...previous, phone: value }))
          }
          keyboardType="phone-pad"
          maxLength={40}
        />
        <View style={styles.actionRow}>
          <Button
            title={`${editingId !== null ? 'Save' : 'Add'} ${label.toLowerCase()}`}
            busy={busy}
            onPress={() => void saveContact(kind)}
          />
          {editingId !== null ? (
            <Button
              title="Cancel"
              variant="ghost"
              onPress={cancelEdit}
            />
          ) : null}
        </View>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contact}>
            <Text style={styles.title}>{contact.name}</Text>
            <Text style={styles.muted}>
              {contact.email || 'No email'} · {contact.phone || 'No phone'}
            </Text>
            <Text style={styles.muted}>
              {contact.active ? 'Active' : 'Inactive'}
            </Text>
            <View style={styles.actionRow}>
              <Button
                title="Edit"
                variant="secondary"
                onPress={() => editContact(kind, contact)}
              />
              <Button
                title={contact.active ? 'Deactivate' : 'Activate'}
                variant="ghost"
                busy={busyId === `${kind}-${contact.id}`}
                onPress={() => void toggleContact(kind, contact)}
              />
            </View>
          </View>
        ))}
        {contacts.length === 0 ? (
          <Text style={styles.muted}>No {label.toLowerCase()}s yet.</Text>
        ) : null}
      </Card>
    );
  }

  return (
    <AdminFrame
      title="Procurement & stock"
      subtitle="Manage suppliers, accountable staff, and received inventory."
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {providersState.error ? (
        <ErrorState
          message={`Providers: ${providersState.error}`}
          onRetry={providersState.reload}
        />
      ) : null}
      {accountablesState.error ? (
        <ErrorState
          message={`Accountables: ${accountablesState.error}`}
          onRetry={accountablesState.reload}
        />
      ) : null}
      {renderContacts(
        'provider',
        providers,
        providerForm,
        setProviderForm,
        providerEditId,
        () => {
          setProviderEditId(null);
          setProviderForm(EMPTY_CONTACT);
        },
      )}
      {renderContacts(
        'accountable',
        accountables,
        accountableForm,
        setAccountableForm,
        accountableEditId,
        () => {
          setAccountableEditId(null);
          setAccountableForm(EMPTY_CONTACT);
        },
      )}
      <Card>
        <PageTitle
          title="Receive stock"
          subtitle="Recording a receipt adds its quantities to variant inventory."
        />
        <SelectField
          label="Provider"
          value={receipt.providerId}
          onChange={(value) =>
            setReceipt((previous) => ({ ...previous, providerId: value }))
          }
          options={[
            { value: '', label: 'Select provider' },
            ...providers
              .filter((provider) => provider.active)
              .map((provider) => ({
                value: String(provider.id),
                label: provider.name,
              })),
          ]}
        />
        <SelectField
          label="Accountable"
          value={receipt.accountableId}
          onChange={(value) =>
            setReceipt((previous) => ({ ...previous, accountableId: value }))
          }
          options={[
            { value: '', label: 'Select accountable' },
            ...accountables
              .filter((person) => person.active)
              .map((person) => ({
                value: String(person.id),
                label: person.name,
              })),
          ]}
        />
        <TextField
          label="Purchase date (local time, optional)"
          value={receipt.purchaseDate}
          onChangeText={(value) =>
            setReceipt((previous) => ({ ...previous, purchaseDate: value }))
          }
          placeholder="YYYY-MM-DDTHH:mm"
        />
        <TextField
          label="Reference number"
          value={receipt.referenceNumber}
          onChangeText={(value) =>
            setReceipt((previous) => ({ ...previous, referenceNumber: value }))
          }
          maxLength={100}
        />
        <TextField
          label="Package notes"
          value={receipt.notes}
          onChangeText={(value) =>
            setReceipt((previous) => ({ ...previous, notes: value }))
          }
          multiline
        />
        {productsState.error ? (
          <ErrorState
            message={`Product variants: ${productsState.error}`}
            onRetry={productsState.reload}
          />
        ) : null}
        <SelectField
          label="Product variant"
          value={lineForm.variantItemId}
          onChange={(value) =>
            setLineForm((previous) => ({ ...previous, variantItemId: value }))
          }
          disabled={productsState.loading}
          options={[
            { value: '', label: 'Select a variant' },
            ...activeVariants.map((variant) => ({
              value: String(variant.variantItemId),
              label: `${variant.productName} · ${variantLabel(variant)} · Stock ${variant.stockQuantity}`,
            })),
          ]}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Quantity"
              value={lineForm.quantity}
              onChangeText={(value) =>
                setLineForm((previous) => ({ ...previous, quantity: value }))
              }
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Unit cost (EGP)"
              value={lineForm.unitCost}
              onChangeText={(value) =>
                setLineForm((previous) => ({ ...previous, unitCost: value }))
              }
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <TextField
          label="Line notes"
          value={lineForm.notes}
          onChangeText={(value) =>
            setLineForm((previous) => ({ ...previous, notes: value }))
          }
        />
        <Button
          title="Add item to package"
          variant="secondary"
          onPress={addReceiptLine}
        />
        {lines.map((line) => (
          <View key={line.variantItemId} style={styles.line}>
            <Text style={styles.title}>
              {lineLabels[line.variantItemId] ??
                `Variant #${line.variantItemId}`}
            </Text>
            <Text style={styles.muted}>
              × {line.quantity} · {formatMoney(line.unitCost)} each
            </Text>
            <Button
              title="Remove item"
              variant="ghost"
              onPress={() => {
                setLines((previous) =>
                  previous.filter(
                    (item) => item.variantItemId !== line.variantItemId,
                  ),
                );
                setLineLabels((previous) => {
                  const next = { ...previous };
                  delete next[line.variantItemId];
                  return next;
                });
              }}
            />
          </View>
        ))}
        {lines.length ? (
          <Text style={styles.title}>
            Total cost:{' '}
            {formatMoney(
              lines.reduce(
                (sum, line) => sum + line.quantity * line.unitCost,
                0,
              ),
            )}
          </Text>
        ) : null}
        <Button
          title="Receive package"
          busy={busy}
          disabled={!lines.length}
          onPress={() => void receivePackage()}
        />
      </Card>
      <Card>
        <PageTitle title="Received packages" subtitle="Recent stock receipts." />
        {packagesState.error ? (
          <ErrorState
            message={packagesState.error}
            onRetry={packagesState.reload}
          />
        ) : null}
        {!packagesState.loading &&
        !packagesState.error &&
        !packages.items.length ? (
          <EmptyState
            title="No stock receipts yet"
            description="Received packages will be listed here."
          />
        ) : null}
        {packages.items.map((item) => (
          <View key={item.id} style={styles.package}>
            <Text style={styles.title}>
              {item.referenceNumber || `Package #${item.id}`}
            </Text>
            <Text style={styles.muted}>
              {formatDate(item.purchaseDate)} · {item.providerName} · Received
              by {item.accountableName}
            </Text>
            <Text style={styles.title}>{formatMoney(item.totalCost)}</Text>
            {(item.items ?? []).map((line) => (
              <Text
                key={`${item.id}-${line.variantItemId}`}
                style={styles.muted}
              >
                Variant #{line.variantItemId} · {line.quantity} ×{' '}
                {formatMoney(line.unitCost)} = {formatMoney(line.lineTotal)}
              </Text>
            ))}
            {item.notes ? (
              <Text style={styles.muted}>{item.notes}</Text>
            ) : null}
          </View>
        ))}
        <Pagination
          page={packages.page}
          totalPages={packages.totalPages}
          onChange={setPackagePage}
        />
      </Card>
    </AdminFrame>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  contact: {
    paddingTop: 12,
    gap: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  line: {
    paddingVertical: 10,
    gap: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  package: {
    paddingVertical: 10,
    gap: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  });
}
