const getFirstFieldError = (value) => {
  if (Array.isArray(value) && value.length) {
    return String(value[0]);
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return "";
};

export const getApiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (typeof payload?.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if (payload?.errors && typeof payload.errors === "object") {
    const firstError = Object.values(payload.errors)
      .map(getFirstFieldError)
      .find(Boolean);
    if (firstError) {
      return firstError;
    }
  }

  return fallback;
};
