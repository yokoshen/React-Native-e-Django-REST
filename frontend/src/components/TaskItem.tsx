import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Task } from "../api/tasks";
import { colors, radius, spacing } from "../theme";

type Props = {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => onToggle(task)}
        style={[styles.checkbox, task.completed && styles.checkboxOn]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
      >
        {task.completed ? <Text style={styles.check}>✓</Text> : null}
      </TouchableOpacity>

      <TouchableOpacity style={styles.body} onPress={() => onEdit(task)}>
        <Text style={[styles.title, task.completed && styles.titleDone]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <Text style={styles.date}>Criada em {formatDate(task.created_at)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDelete(task)}
        style={styles.delete}
        accessibilityLabel="Excluir tarefa"
      >
        <Text style={styles.deleteText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  checkboxOn: { backgroundColor: colors.primary },
  check: { color: colors.white, fontWeight: "800", fontSize: 15 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  titleDone: { textDecorationLine: "line-through", color: colors.muted },
  desc: { fontSize: 14, color: colors.muted, marginTop: 2 },
  date: { fontSize: 12, color: colors.muted, marginTop: 4 },
  delete: { padding: spacing.sm, marginLeft: spacing.sm },
  deleteText: { fontSize: 18 },
});
