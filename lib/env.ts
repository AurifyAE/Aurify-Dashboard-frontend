// lib/env.ts

/** Aurify API base URL (e.g. https://api.aurify.ae/device) */
export const API_URL =
  process.env.NEXT_PUBLIC_URL || "https://api.aurify.ae/device";

/** API key for X-Secret-Key header */
export const API_KEY =
  process.env.NEXT_PUBLIC_API_KEY || "";

/** Admin ID for API requests */
export const ADMIN_ID =
  process.env.NEXT_PUBLIC_ADMIN_ID || "";

/** Socket secret key */
export const SOCKET_SECRET =
  process.env.NEXT_PUBLIC_SOCKET_SECRET_KEY || "aurify@123";

/** Backend API base URL for commodities, auth, etc. */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";