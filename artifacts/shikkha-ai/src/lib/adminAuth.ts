const TOKEN_KEY = "qovo-admin-token";

export function getAdminToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function isAdminMode(): boolean {
  return !!getAdminToken();
}

export function setAdminSession(token: string): void {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearAdminSession(): void {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
}

export function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { "x-admin-token": token } : {};
}
