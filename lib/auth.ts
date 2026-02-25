// Token helpers using localStorage + cookie (so Next.js middleware can guard routes)
const TOKEN_KEY = "aurify_token";

export const setToken = (token: string): void => {
    if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
        // Set cookie for Next.js middleware (7-day expiry)
        document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
};

export const getToken = (): string | null => {
    if (typeof window !== "undefined") {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
};

export const removeToken = (): void => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        // Remove cookie
        document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    }
};

export type UserRole = "super_admin" | "admin" | "user";

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    companyName: string;
    phone?: string;
    status?: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: AuthUser;
    message?: string;
    errors?: Record<string, string>;
}

// Decode JWT payload without verifying (client side only — just for reading claims)
export const decodeToken = (token: string): AuthUser | null => {
    try {
        const base64 = token.split(".")[1];
        const decoded = JSON.parse(atob(base64));
        return {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            companyName: decoded.companyName,
        };
    } catch {
        return null;
    }
};

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const apiLogin = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
};

export const apiRegister = async (data: {
    companyName: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
}): Promise<AuthResponse> => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};
