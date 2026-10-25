const API = `http://${window.location.hostname}:8000/api/v1`;

export type ApiFeedbackEvent =
  | { type: "pending"; count: number }
  | { type: "toast"; message: string; severity: "success" | "error" };

const feedbackListeners = new Set<(event: ApiFeedbackEvent) => void>();
let pendingRequests = 0;

function emitFeedback(event: ApiFeedbackEvent) {
  feedbackListeners.forEach((listener) => listener(event));
}

export function subscribeApiFeedback(
  listener: (event: ApiFeedbackEvent) => void,
) {
  feedbackListeners.add(listener);
  listener({ type: "pending", count: pendingRequests });
  return () => {
    feedbackListeners.delete(listener);
  };
}

function successMessage(path: string, method: string) {
  const endpoint = path.split("?")[0];
  if (endpoint === "/auth/signup") return "Your account was created successfully.";
  if (endpoint === "/auth/login") return "You are signed in.";
  if (/\/providers\/\d+\/reviews$/.test(endpoint)) {
    return "Your rating and comment were submitted.";
  }
  if (endpoint === "/customer/events") return "Your event request was sent.";
  if (/\/customer\/shortlist\/\d+\/note$/.test(endpoint)) {
    return "Your comment was saved.";
  }
  if (/\/customer\/shortlist\/\d+\/status$/.test(endpoint)) {
    return new URLSearchParams(path.split("?")[1]).get("status") === "SELECTED"
      ? "Provider selected as your final choice."
      : "Your shortlist was updated.";
  }
  if (endpoint === "/customer/shortlist" && method === "POST") {
    return "Provider added to your shortlist.";
  }
  if (/\/customer\/shortlist\/\d+$/.test(endpoint) && method === "DELETE") {
    return "Provider removed from your shortlist.";
  }
  if (endpoint === "/profile") return "Your profile was updated.";
  if (endpoint === "/settings/notifications") {
    return "Notification preferences were saved.";
  }
  if (endpoint === "/settings/password") return "Your password was changed.";
  if (endpoint === "/provider/profile") return "Provider profile saved.";
  if (endpoint.includes("/quote")) return "Your quote was submitted.";
  if (endpoint === "/provider/availability") return "Availability was updated.";
  if (endpoint.startsWith("/admin/")) return "Your changes were saved.";
  if (method === "DELETE") return "Item removed successfully.";
  return "Changes saved successfully.";
}

export function getToken() {
  return localStorage.getItem("eh_token") || "";
}

export async function api(path: string, opts: any = {}) {
  const method = String(opts.method || "GET").toUpperCase();
  pendingRequests += 1;
  emitFeedback({ type: "pending", count: pendingRequests });
  try {
    const response = await fetch(API + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
        ...(getToken() ? { Authorization: "Bearer " + getToken() } : {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw Error(data.detail || "Request failed");
    }
    if (!["GET", "HEAD"].includes(method)) {
      emitFeedback({
        type: "toast",
        message: successMessage(path, method),
        severity: "success",
      });
    }
    return data;
  } catch (cause) {
    if (!["GET", "HEAD"].includes(method)) {
      emitFeedback({
        type: "toast",
        message:
          cause instanceof Error ? cause.message : "The request could not be completed.",
        severity: "error",
      });
    }
    throw cause;
  } finally {
    pendingRequests -= 1;
    emitFeedback({ type: "pending", count: pendingRequests });
  }
}
