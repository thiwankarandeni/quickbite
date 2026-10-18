// A small typed wrapper around fetch() for calling the FastAPI backend.
//
// ARCHITECTURE NOTE
//   The browser never talks to FastAPI directly. Server Components and Server
//   Actions (both run on the Next.js server) call FastAPI with this helper. So:
//     - the JWT can live in an httpOnly cookie that client JS can't read
//     - no CORS is needed between Next.js and FastAPI
//   This setup is often called "Backend for Frontend" (BFF).
import "server-only"; // build error if a Client Component ever imports this file

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  json?: unknown; // sent as a JSON body
  form?: Record<string, string>; // sent as form data (used by /auth/login)
};

// <T> is a generic: callers say what type they expect back, e.g.
//   const items = await api<MenuItem[]>("/menu")
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    body = new URLSearchParams(opts.form);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await readError(res));
  }
  if (res.status === 204) return undefined as T; // "No Content"
  return res.json() as Promise<T>;
}

// FastAPI errors look like {"detail": "message"} or, for validation errors (422),
// {"detail": [{"loc": [...], "msg": "..."}]}. Turn either into one readable string.
async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((d: { loc: string[]; msg: string }) => `${d.loc.at(-1)}: ${d.msg}`)
        .join(", ");
    }
  } catch {
    // body wasn't JSON
  }
  return `Request failed (${res.status})`;
}
