import axios from "axios";

import { API_URL } from "../config";
import { api } from "./client";

export type User = {
  id: number;
  username: string;
  email: string;
  date_joined: string;
};

export type TokenPair = {
  access: string;
  refresh: string;
};

/** Login uses a bare axios instance (no token attached yet). */
export async function login(username: string, password: string): Promise<TokenPair> {
  const { data } = await axios.post<TokenPair>(`${API_URL}/api/auth/token/`, {
    username,
    password,
  });
  return data;
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const { data } = await axios.post<User>(`${API_URL}/api/auth/register/`, {
    username,
    email,
    password,
  });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}

/** Revoga o refresh token no servidor (blacklist). Best-effort/idempotente. */
export async function logout(refresh: string): Promise<void> {
  await api.post("/auth/logout/", { refresh });
}

export async function requestPasswordReset(email: string): Promise<string> {
  const { data } = await axios.post<{ detail: string }>(
    `${API_URL}/api/auth/password-reset/`,
    { email }
  );
  return data.detail;
}

export async function confirmPasswordReset(
  uid: string,
  token: string,
  newPassword: string
): Promise<string> {
  const { data } = await axios.post<{ detail: string }>(
    `${API_URL}/api/auth/password-reset/confirm/`,
    { uid, token, new_password: newPassword }
  );
  return data.detail;
}
