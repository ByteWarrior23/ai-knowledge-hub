const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function getApiErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosErr = err as { response?: { data?: { detail?: string }; status?: number }; message?: string };
    if (axiosErr.response?.status === 429) {
      return "API quota exceeded. Wait a moment and try again.";
    }
    return axiosErr.response?.data?.detail || axiosErr.message || "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

export { API_BASE };
