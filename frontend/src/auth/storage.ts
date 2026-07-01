import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Secure token storage abstraction.
 *
 * - Native (iOS/Android): expo-secure-store, which is backed by the iOS
 *   Keychain and Android Keystore (encrypted, not plain text).
 * - Web: SecureStore is not available, so we fall back to localStorage.
 *   This is a known limitation of the web build — documented in the README.
 */
const ACCESS_KEY = "todo_access_token";
const REFRESH_KEY = "todo_refresh_token";

const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  async save(access: string, refresh: string) {
    await setItem(ACCESS_KEY, access);
    await setItem(REFRESH_KEY, refresh);
  },
  async saveAccess(access: string) {
    await setItem(ACCESS_KEY, access);
  },
  getAccess: () => getItem(ACCESS_KEY),
  getRefresh: () => getItem(REFRESH_KEY),
  async clear() {
    await removeItem(ACCESS_KEY);
    await removeItem(REFRESH_KEY);
  },
};
