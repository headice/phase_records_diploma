import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api, { clearTokens, setTokens } from "../api/client";

const getApiErrorMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;

  const fieldError = Object.values(data).find((value) =>
    Array.isArray(value) ? value.length > 0 : typeof value === "string"
  );
  if (Array.isArray(fieldError)) return String(fieldError[0]);
  if (typeof fieldError === "string") return fieldError;

  return fallback;
};

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  register: async () => {},
  login: async () => {},
  requestPasswordReset: async () => {},
  confirmPasswordReset: async () => {},
  updateProfile: async () => {},
  logout: () => {},
  requireAuth: () => false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const access = localStorage.getItem("access_token");
    if (!access) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get("auth/me/");
      setUser(data);
    } catch (error) {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(async ({ email, password }) => {
    try {
      const { data } = await api.post("auth/login/", { email, password });
      setTokens({ access: data.access, refresh: data.refresh });
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(
          error.response?.data,
          "Не удалось войти. Проверьте email и пароль."
        ),
      };
    }
  }, []);

  const register = useCallback(
    async (payload) => {
      try {
        await api.post("auth/register/", payload);
        return await login({ email: payload.email, password: payload.password });
      } catch (error) {
        return {
          success: false,
          error: getApiErrorMessage(
            error.response?.data,
            "Не удалось зарегистрироваться. Проверьте email, логин и пароль."
          ),
        };
      }
    },
    [login]
  );

  const requestPasswordReset = useCallback(async (email) => {
    try {
      await api.post("auth/password-reset/", { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(
          error.response?.data,
          "Не удалось отправить письмо восстановления."
        ),
      };
    }
  }, []);

  const confirmPasswordReset = useCallback(async ({ uid, token, newPassword }) => {
    try {
      await api.post("auth/password-reset/confirm/", {
        uid,
        token,
        new_password: newPassword,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(
          error.response?.data,
          "Не удалось обновить пароль."
        ),
      };
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    try {
      const { data } = await api.put("auth/me/", payload);
      setUser(data);
      return { success: true, user: data };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(
          error.response?.data,
          "Не удалось сохранить профиль. Проверьте имя, почту и телефон."
        ),
      };
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const requireAuth = useCallback(
    (onFail) => {
      const authed = Boolean(localStorage.getItem("access_token"));
      if (authed) return true;
      if (onFail) onFail();
      return false;
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      register,
      login,
      requestPasswordReset,
      confirmPasswordReset,
      updateProfile,
      logout,
      requireAuth,
    }),
    [
      confirmPasswordReset,
      isLoading,
      login,
      logout,
      register,
      requestPasswordReset,
      requireAuth,
      updateProfile,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
