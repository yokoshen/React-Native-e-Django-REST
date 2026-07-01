import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Task, TaskStatusFilter } from "../api/tasks";
import { getErrorMessage } from "../api/client";
import { confirmAction } from "../components/confirm";
import { ErrorBanner } from "../components/ui";
import { TaskItem } from "../components/TaskItem";
import { useAuth } from "../auth/AuthContext";
import { useDeleteTask, useTasks, useToggleTask } from "../hooks/useTasks";
import { colors, radius, spacing } from "../theme";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "TaskList">;

const STATUS_TABS: { key: TaskStatusFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "completed", label: "Concluídas" },
];

const DATE_FILTERS: { key: string; label: string; days: number | null }[] = [
  { key: "any", label: "Qualquer data", days: null },
  { key: "7d", label: "Últimos 7 dias", days: 7 },
  { key: "today", label: "Hoje", days: 0 },
];

function isoNDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function TaskListScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<TaskStatusFilter>("all");
  const [dateKey, setDateKey] = useState("any");
  const [newestFirst, setNewestFirst] = useState(true);

  const params = useMemo(() => {
    const df = DATE_FILTERS.find((d) => d.key === dateKey);
    return {
      status,
      ordering: newestFirst ? "-created_at" : "created_at",
      createdAfter: df?.days != null ? isoNDaysAgo(df.days) : undefined,
    };
  }, [status, dateKey, newestFirst]);

  const { data: tasks, isLoading, isError, error, refetch, isRefetching } = useTasks(params);
  const toggle = useToggleTask();
  const remove = useDeleteTask();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout} accessibilityLabel="Sair">
          <Text style={styles.logout}>Sair</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  const onDelete = (task: Task) => {
    confirmAction("Excluir tarefa", `Remover "${task.title}"?`, () => {
      remove.mutate(task.id);
    }, "Excluir");
  };

  const renderHeader = () => (
    <View>
      {user ? <Text style={styles.greeting}>Olá, {user.username} 👋</Text> : null}

      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, status === tab.key && styles.tabActive]}
            onPress={() => setStatus(tab.key)}
          >
            <Text style={[styles.tabText, status === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {DATE_FILTERS.map((df) => (
          <TouchableOpacity
            key={df.key}
            style={[styles.chip, dateKey === df.key && styles.chipActive]}
            onPress={() => setDateKey(df.key)}
          >
            <Text style={[styles.chipText, dateKey === df.key && styles.chipTextActive]}>
              {df.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.chip}
          onPress={() => setNewestFirst((v) => !v)}
        >
          <Text style={styles.chipText}>
            {newestFirst ? "↓ Recentes" : "↑ Antigas"}
          </Text>
        </TouchableOpacity>
      </View>

      {isError ? <ErrorBanner message={getErrorMessage(error)} /> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks ?? []}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggle={(t) => toggle.mutate(t)}
              onEdit={(t) => navigation.navigate("TaskForm", { task: t })}
              onDelete={onDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhuma tarefa por aqui</Text>
              <Text style={styles.emptyText}>
                Toque no botão + para criar sua primeira tarefa.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TaskForm")}
        accessibilityLabel="Nova tarefa"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.md, paddingBottom: 96, maxWidth: 640, width: "100%", alignSelf: "center" },
  greeting: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: "center", borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.muted, fontWeight: "600" },
  tabTextActive: { color: colors.white },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  empty: { alignItems: "center", padding: spacing.xl, marginTop: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: spacing.sm },
  logout: { color: colors.white, fontWeight: "700", fontSize: 15, paddingHorizontal: spacing.sm },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: colors.white, fontSize: 32, marginTop: -2 },
});
