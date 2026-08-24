import axios, { type AxiosError } from "axios";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

export const TOKEN_KEY = "formcraft.access_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// The backend returns either:
//  - AppException -> { "detail": "message string" }
//  - FastAPI validation (422) -> { "detail": [{ loc, msg, type }, ...] }
export function normalizeError(err: unknown): ApiError {
  const axErr = err as AxiosError<{ detail?: unknown }>;

  if (axErr?.response) {
    const status = axErr.response.status;
    const detail = axErr.response.data?.detail;

    if (typeof detail === "string") {
      return new ApiError(detail, status);
    }

    if (Array.isArray(detail)) {
      const fieldErrors: Record<string, string> = {};
      const messages: string[] = [];

      for (const item of detail as Array<{ loc?: unknown[]; msg?: string }>) {
        const field = Array.isArray(item.loc) ? String(item.loc[item.loc.length - 1]) : "field";
        const msg = item.msg ?? "Invalid value.";
        fieldErrors[field] = msg;
        messages.push(`${field}: ${msg}`);
      }

      return new ApiError(messages.join(" · ") || "Validation failed.", status, fieldErrors);
    }

    if (status === 0 || !axErr.response.data) {
      return new ApiError("Something went wrong. Please try again.", status);
    }

    return new ApiError("Something went wrong. Please try again.", status);
  }

  if (axErr?.request) {
    return new ApiError(
      "Can't reach the server. Check your connection and try again.",
      0,
    );
  }

  return new ApiError((err as Error)?.message ?? "Unexpected error.", 0);
}

// -------- File uploads --------

export interface UploadedFile {
  file_url: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number;
}

export async function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<UploadedFile>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  return res.data;
}

export function resolveFileUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${fileUrl}`;
}
