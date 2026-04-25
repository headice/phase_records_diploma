import axios from "axios";

const baseURL =
  (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/").replace(
    /\/?$/,
    "/"
  );

let accessToken = localStorage.getItem("access_token");
let refreshToken = localStorage.getItem("refresh_token");
let refreshRequest = null;

export const setTokens = ({ access, refresh }) => {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (access) {
    localStorage.setItem("access_token", access);
  } else {
    localStorage.removeItem("access_token");
  }
  if (refresh) {
    localStorage.setItem("refresh_token", refresh);
  } else {
    localStorage.removeItem("refresh_token");
  }
};

export const clearTokens = () => {
  setTokens({ access: null, refresh: null });
};

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  if (accessToken && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest.__isRetryRequest &&
      !originalRequest.skipAuth &&
      !String(originalRequest.url || "").includes("auth/refresh/")
    ) {
      try {
        if (!refreshRequest) {
          refreshRequest = axios
            .post(`${baseURL}auth/refresh/`, {
              refresh: refreshToken,
            })
            .then((response) => {
              setTokens({
                access: response.data.access,
                refresh: response.data.refresh || refreshToken,
              });
              return response.data.access;
            })
            .finally(() => {
              refreshRequest = null;
            });
        }

        const nextAccessToken = await refreshRequest;
        originalRequest.__isRetryRequest = true;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
