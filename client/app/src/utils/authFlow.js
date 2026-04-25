const AUTH_REDIRECT_KEY = "phase.auth.redirect";
const AUTH_ACTION_KEY = "phase.auth.action";
const BOOKING_DRAFT_KEY = "phase.booking.draft";

const canUseSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const readJson = (key) => {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
};

const writeJson = (key, value) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
};

const clearKey = (key) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(key);
};

export const storeAuthRedirect = (path) => {
  if (!path) return;
  writeJson(AUTH_REDIRECT_KEY, { path });
};

export const peekAuthRedirect = () => readJson(AUTH_REDIRECT_KEY)?.path || null;

export const clearAuthRedirect = () => {
  clearKey(AUTH_REDIRECT_KEY);
};

export const storePendingAuthAction = (action) => {
  if (!action) return;
  writeJson(AUTH_ACTION_KEY, action);
};

export const peekPendingAuthAction = () => readJson(AUTH_ACTION_KEY);

export const clearPendingAuthAction = () => {
  clearKey(AUTH_ACTION_KEY);
};

export const storeBookingDraft = (draft) => {
  if (!draft) return;
  writeJson(BOOKING_DRAFT_KEY, draft);
};

export const peekBookingDraft = () => readJson(BOOKING_DRAFT_KEY);

export const clearBookingDraft = () => {
  clearKey(BOOKING_DRAFT_KEY);
};

export const clearAuthFlowState = () => {
  clearAuthRedirect();
  clearPendingAuthAction();
};
