export function sanitize(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidContact(contact) {
  return contact && contact.length >= 3 && contact.length <= 120;
}

export function canSubmit(key, cooldownMs = 5000) {
  const lastTime = sessionStorage.getItem(`rate_${key}`);
  if (lastTime && Date.now() - parseInt(lastTime, 10) < cooldownMs) {
    return false;
  }
  sessionStorage.setItem(`rate_${key}`, String(Date.now()));
  return true;
}
