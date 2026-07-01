import React, { useLayoutEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getErrorMessage } from "../api/client";
import { Button, ErrorBanner, Input } from "../components/ui";
import { useCreateTask, useUpdateTask } from "../hooks/useTasks";
import { colors, spacing } from "../theme";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "TaskForm">;

export default function TaskFormScreen({ navigation, route }: Props) {
  const editing = route.params?.task;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [completed, setCompleted] = useState(editing?.completed ?? false);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateTask();
  const update = useUpdateTask();
  const loading = create.isPending || update.isPending;

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? "Editar tarefa" : "Nova tarefa" });
  }, [navigation, editing]);

  const onSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("O título não pode ficar vazio.");
      return;
    }
    const input = { title: title.trim(), description: description.trim(), completed };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input });
      } else {
        await create.mutateAsync(input);
      }
      navigation.goBack();
    } catch (e) {
      setError(getErrorMessage(e, "Não foi possível salvar a tarefa."));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />

        <Input
          label="Título"
          value={title}
          onChangeText={setTitle}
          placeholder="O que precisa ser feito?"
          maxLength={200}
          autoFocus
        />
        <Input
          label="Descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Detalhes..."
          multiline
          numberOfLines={4}
          style={styles.textarea}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Concluída</Text>
          <Switch
            value={completed}
            onValueChange={setCompleted}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <Button
          title={editing ? "Salvar alterações" : "Criar tarefa"}
          onPress={onSubmit}
          loading={loading}
        />
        <View style={{ height: spacing.sm }} />
        <Button title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, maxWidth: 560, width: "100%", alignSelf: "center" },
  textarea: { height: 110, textAlignVertical: "top", paddingTop: spacing.sm },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  switchLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
});
