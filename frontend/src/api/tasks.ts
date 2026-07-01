import { api } from "./client";

export type Task = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskStatusFilter = "all" | "pending" | "completed";

export type TaskListParams = {
  status?: TaskStatusFilter;
  ordering?: string; // e.g. "-created_at" | "created_at"
  createdAfter?: string; // YYYY-MM-DD
  createdBefore?: string; // YYYY-MM-DD
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function fetchTasks(params: TaskListParams = {}): Promise<Task[]> {
  const query: Record<string, string> = {};
  if (params.status === "completed") query.completed = "true";
  if (params.status === "pending") query.completed = "false";
  if (params.ordering) query.ordering = params.ordering;
  if (params.createdAfter) query.created_after = params.createdAfter;
  if (params.createdBefore) query.created_before = params.createdBefore;

  const { data } = await api.get<Paginated<Task> | Task[]>("/tasks/", { params: query });
  // The API is paginated; be tolerant if pagination is ever disabled.
  return Array.isArray(data) ? data : data.results;
}

export type TaskInput = {
  title: string;
  description?: string;
  completed?: boolean;
};

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<Task>("/tasks/", input);
  return data;
}

export async function updateTask(id: number, input: Partial<TaskInput>): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}/`, input);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}/`);
}
