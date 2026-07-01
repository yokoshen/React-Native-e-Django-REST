import Constants from "expo-constants";

/**
 * Base URL of the Django API.
 *
 * Resolution order:
 *  1. EXPO_PUBLIC_API_URL env var (used by the Docker container / .env)
 *  2. `extra.apiUrl` from app.json
 *  3. localhost fallback
 *
 * Note for physical devices: `localhost` points to the device itself, so set
 * EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g. http://192.168.0.10:8000).
 */
const fromEnv = process.env.EXPO_PUBLIC_API_URL;
const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_URL = (fromEnv || fromExtra || "http://localhost:8000").replace(/\/$/, "");
