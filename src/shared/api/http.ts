import { tokenStore } from "./tokenStore";
import { sessionEvents } from "../auth/sessionEvents";
import type { ApiError, ApiValidationErrors } from "./apiError";
import { clientContext } from "../telemetry/clientContext";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method: HttpMethod;
  path: string;
  body?: unknown;
};

type ErrorResponseShape = {
  message?: string;
  errors?: ApiValidationErrors;
  code?: string;
};

function buildUrl(baseUrl: string, path: string) {
  const a = baseUrl.replace(/\/+$/, "");
  const b = path.startsWith("/") ? path : `/${path}`;
  return `${a}${b}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseErrorResponse(data: unknown): ErrorResponseShape {
  if (!isObject(data)) return {};
  const result: ErrorResponseShape = {};

  if (typeof data.message === "string") result.message = data.message;
  if (isObject(data.errors)) result.errors = data.errors as ApiValidationErrors;
  if (typeof data.code === "string") result.code = data.code;

  return result;
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...clientContext.toHeaders(),
    };

    const token = tokenStore.get();
    const hasAuth = Boolean(token);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }

    let response: Response;
    try {
      response = await fetch(buildUrl(this.baseUrl, opts.path), {
        method: opts.method,
        headers,
        body,

        credentials: "omit",
      });
    } catch {
      throw {
        kind: "network",
        status: 0,
        message: "No se pudo conectar con el servidor.",
      } as ApiError;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    const data: unknown = isJson
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    const parsed = isJson ? parseErrorResponse(data) : {};

    if (response.ok) return data as T;

    if (response.status === 422) {
      throw {
        kind: "validation",
        status: 422,
        message: parsed.message ?? "Error de validación.",
        errors: parsed.errors ?? {},
      } as ApiError;
    }

    if (response.status === 401) {
      if (hasAuth) {
        tokenStore.clear();
        sessionEvents.notifyUnauthorized({
          status: 401,
          code: parsed.code,
          message: parsed.message ?? "No autorizado.",
        });
      }

      throw {
        kind: "unauthorized",
        status: 401,
        message: parsed.message ?? "No autorizado.",
        code: parsed.code,
      } as ApiError;
    }

    if (response.status === 403) {
      throw {
        kind: "forbidden",
        status: 403,
        message: parsed.message ?? "Acceso denegado.",
      } as ApiError;
    }

    throw {
      kind: "server",
      status: response.status,
      message: parsed.message ?? `Error HTTP ${response.status}.`,
    } as ApiError;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>({ method: "GET", path });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", path, body });
  }
}
