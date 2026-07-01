import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTask,
  deleteTask,
  fetchTasks,
  Task,
  TaskInput,
  TaskListParams,
  updateTask,
} from "../api/tasks";

const TASKS_KEY = "tasks";

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: [TASKS_KEY, params],
    queryFn: () => fetchTasks(params),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<TaskInput> }) =>
      updateTask(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Task) => updateTask(task.id, { completed: !task.completed }),
    // Optimistic update for instant visual feedback.
    onMutate: async (task: Task) => {
      await qc.cancelQueries({ queryKey: [TASKS_KEY] });
      const snapshots = qc.getQueriesData<Task[]>({ queryKey: [TASKS_KEY] });
      snapshots.forEach(([key, list]) => {
        if (!list) return;
        qc.setQueryData<Task[]>(
          key,
          list.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
        );
      });
      return { snapshots };
    },
    onError: (_err, _task, context) => {
      context?.snapshots.forEach(([key, list]) => qc.setQueryData(key, list));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_KEY] }),
  });
}
