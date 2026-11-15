import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adminApi } from '../../api/authApi';
import type { AuditLog } from '../../api/adminTypes';
import { useSession } from '../../auth/useSession';
import { useApiResource } from '../../hooks/useApiResource';
import {
  formatDate,
  normalizePage,
  prettyStatus,
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
import { AdminFrame, AuditValue } from './AdminCommon';
import { useAppTheme } from '../../ThemeProvider';

export function AdminUsers() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user: currentUser } = useSession();
  const [page, setPage] = useState(0);
  const loadUsers = useCallback(() => adminApi.listUsers(page, 20), [page]);
  const state = useApiResource(loadUsers);
  const usersPage = normalizePage(state.data);
  const [filter, setFilter] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<Awaited<
    ReturnType<typeof adminApi.getUser>
  > | null>(null);
  const [error, setError] = useState('');

  const users = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return query
      ? usersPage.items.filter((item) =>
          `${item.firstName} ${item.lastName} ${item.email}`
            .toLowerCase()
            .includes(query),
        )
      : usersPage.items;
  }, [usersPage.items, filter]);

  async function toggleUser(id: number, active: boolean) {
    setError('');
    if (active && confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setConfirmId(null);
    setBusyId(id);
    try {
      await adminApi.setUserActive(id, !active);
      state.reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update user status.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function showUser(id: number) {
    setSelectedId(id);
    setSelectedUser(null);
    try {
      setSelectedUser(await adminApi.getUser(id));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load user details.',
      );
    }
  }

  return (
    <AdminFrame
      title="Users"
      subtitle={`${usersPage.total} accounts. Status changes are written to the audit log.`}
    >
      <TextField
        label="Filter this page"
        placeholder="Name or email"
        value={filter}
        onChangeText={setFilter}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && users.length === 0 ? (
        <EmptyState
          title="No matching users"
          description="Try another search or move to another page."
        />
      ) : null}
      {users.map((item) => {
        const self = item.id === currentUser?.id;
        return (
          <Card key={item.id}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>
                {item.firstName} {item.lastName}
                {self ? ' (you)' : ''}
              </Text>
              <Text
                style={[
                  styles.badge,
                  item.active ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                {item.active ? 'Active' : 'Deactivated'}
              </Text>
            </View>
            <Text style={styles.muted}>{item.email}</Text>
            <Text style={styles.muted}>
              {prettyStatus(item.role)} · Joined {formatDate(item.registerDate)}
            </Text>
            <View style={styles.actions}>
              <Button
                title={selectedId === item.id ? 'Selected' : 'View details'}
                variant="secondary"
                onPress={() => void showUser(item.id)}
              />
              {!self ? (
                <Button
                  title={
                    item.active && confirmId === item.id
                      ? 'Confirm deactivate'
                      : item.active
                        ? 'Deactivate'
                        : 'Activate'
                  }
                  variant={item.active ? 'ghost' : 'primary'}
                  busy={busyId === item.id}
                  onPress={() => void toggleUser(item.id, item.active)}
                />
              ) : null}
            </View>
          </Card>
        );
      })}
      <Pagination
        page={usersPage.page}
        totalPages={usersPage.totalPages}
        onChange={setPage}
      />
      {selectedUser ? (
        <Card>
          <PageTitle title="User details" />
          <Text style={styles.cardTitle}>
            {selectedUser.firstName} {selectedUser.lastName}
          </Text>
          <Text style={styles.muted}>{selectedUser.email}</Text>
          <Text style={styles.muted}>
            {selectedUser.phone || 'No phone number'}
          </Text>
          <Text style={styles.muted}>
            {prettyStatus(selectedUser.role)} ·{' '}
            {selectedUser.active ? 'Active' : 'Deactivated'}
          </Text>
          <Text style={styles.muted}>
            Joined {formatDate(selectedUser.registerDate)}
          </Text>
          <Button
            title="Close details"
            variant="ghost"
            onPress={() => {
              setSelectedId(null);
              setSelectedUser(null);
            }}
          />
        </Card>
      ) : null}
    </AdminFrame>
  );
}

export function AdminFeedback() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [page, setPage] = useState(0);
  const [satisfied, setSatisfied] = useState('');
  const loadFeedback = useCallback(
    () => adminApi.listFeedback(satisfied, page, 20),
    [satisfied, page],
  );
  const state = useApiResource(loadFeedback);
  const feedback = normalizePage(state.data);

  return (
    <AdminFrame
      title="Customer feedback"
      subtitle={`${feedback.total} messages, newest first.`}
    >
      <SelectField
        label="Show"
        value={satisfied}
        onChange={(value) => {
          setSatisfied(value);
          setPage(0);
        }}
        options={[
          { value: '', label: 'All feedback' },
          { value: 'true', label: 'Satisfied' },
          { value: 'false', label: 'Not satisfied' },
        ]}
      />
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && !feedback.items.length ? (
        <EmptyState
          title="No feedback yet"
          description="Customer messages will appear here."
        />
      ) : null}
      {feedback.items.map((item) => (
        <Card key={item.id}>
          <Text style={styles.cardTitle}>{item.customerName}</Text>
          <Text style={styles.muted}>{item.customerEmail}</Text>
          <Text style={styles.muted}>{formatDate(item.createdAt)}</Text>
          {item.satisfied !== null ? (
            <Text style={styles.badge}>
              {item.satisfied ? 'Satisfied' : 'Not satisfied'}
            </Text>
          ) : null}
          <Text style={styles.body}>{item.text}</Text>
        </Card>
      ))}
      <Pagination
        page={feedback.page}
        totalPages={feedback.totalPages}
        onChange={setPage}
      />
    </AdminFrame>
  );
}

const AUDIT_ACTIONS = [
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
];

export function AdminAuditLog() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [entityId, setEntityId] = useState('');
  const [adminId, setAdminId] = useState('');
  const loadLogs = useCallback(
    () =>
      adminApi.listAuditLogs(page, 20, {
        action,
        entityType: entityId ? 'USER' : '',
        entityId,
        adminId,
      }),
    [page, action, entityId, adminId],
  );
  const state = useApiResource(loadLogs);
  const logs = normalizePage(state.data);

  return (
    <AdminFrame
      title="Audit log"
      subtitle="Permanent record of admin actions. Entries cannot be edited or deleted."
    >
      <SelectField
        label="Action"
        value={action}
        onChange={(value) => {
          setAction(value);
          setPage(0);
        }}
        options={[
          { value: '', label: 'All actions' },
          ...AUDIT_ACTIONS.map((value) => ({
            value,
            label: prettyStatus(value),
          })),
        ]}
      />
      <TextField
        label="User ID"
        value={entityId}
        onChangeText={(value) => {
          setEntityId(value.replace(/\D/g, ''));
          setPage(0);
        }}
        keyboardType="number-pad"
        placeholder="Optional"
      />
      <TextField
        label="Admin ID"
        value={adminId}
        onChangeText={(value) => {
          setAdminId(value.replace(/\D/g, ''));
          setPage(0);
        }}
        keyboardType="number-pad"
        placeholder="Optional"
      />
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!state.loading && !state.error && !logs.items.length ? (
        <EmptyState
          title="No actions recorded"
          description="Matching audit entries will appear here."
        />
      ) : null}
      {logs.items.map((item: AuditLog) => (
        <Card key={item.id}>
          <Text style={styles.cardTitle}>{prettyStatus(item.action)}</Text>
          <Text style={styles.muted}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.muted}>
            {item.adminName ?? 'System'}
            {item.adminEmail ? ` · ${item.adminEmail}` : ''}
          </Text>
          <Text style={styles.muted}>
            {item.entityType} #{item.entityId}
          </Text>
          <AuditValue oldValues={item.oldValues} newValues={item.newValues} />
          <Text style={styles.muted}>IP: {item.ipAddress ?? '—'}</Text>
        </Card>
      ))}
      <Pagination
        page={logs.page}
        totalPages={logs.totalPages}
        onChange={setPage}
      />
    </AdminFrame>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeActive: {
    color: theme.colors.success,
  },
  badgeInactive: {
    color: theme.colors.danger,
  },
  body: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  });
}
