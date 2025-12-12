const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function apiRequest<T>(
  endpoint: string,
  customConfig: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customConfig.headers as Record<string, string>) || {}),
  };

  if (customConfig.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    credentials: "include",
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || "Request failed");
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
