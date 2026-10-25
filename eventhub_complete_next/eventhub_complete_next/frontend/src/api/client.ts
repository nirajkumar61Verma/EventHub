const API = "http://localhost:8000/api/v1";

export function getToken() {
  return localStorage.getItem("eh_token") || "";
}

export async function api(path: string, opts: any = {}) {
  const response = await fetch(API + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(getToken() ? { Authorization: "Bearer " + getToken() } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(data.detail || "Request failed");
  return data;
}
