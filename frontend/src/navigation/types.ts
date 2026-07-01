import { Task } from "../api/tasks";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { uid?: string; token?: string } | undefined;
};

export type AppStackParamList = {
  TaskList: undefined;
  TaskForm: { task?: Task } | undefined;
};
