import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST, PUT, PATCH, DELETE } from "./+server";

declare const DELCOM_UPSTREAM: string;

function call(
  handler: any,
  { method = "GET", path = "courses", search = "", headers = {}, body }: any = {}
) {
  const request = new Request(`http://localhost/api/delcom/${path}${search}`, {
    method,
    headers,
    body,
  });
  return handler({
    request,
    params: { path },
    url: new URL(request.url),
  });
}

describe("delcom proxy (+server.ts)", () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes the same handler for every HTTP method", () => {
    expect(GET).toBe(POST);
    expect(POST).toBe(PUT);
    expect(PUT).toBe(PATCH);
    expect(PATCH).toBe(DELETE);
  });

  it("forwards a GET request with query and auth header, without body", async () => {
    fetchSpy.mockResolvedValue(
      new Response('{"status":"success"}', {
        status: 200,
        headers: { "content-type": "application/json", "set-cookie": "x=1" },
      })
    );

    const response = await call(GET, {
      path: "courses",
      search: "?is_me=1",
      headers: { authorization: "Bearer abc", cookie: "secret=1" },
    });

    const [target, options] = fetchSpy.mock.calls[0];
    expect(target).toBe(`${DELCOM_UPSTREAM}/courses?is_me=1`);
    expect(options.method).toBe("GET");
    expect(options.body).toBeUndefined();
    expect(options.headers.get("authorization")).toBe("Bearer abc");
    expect(options.headers.get("cookie")).toBeNull();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({ status: "success" });
  });

  it("forwards a request body and content type for POST", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 201 }));

    const response = await call(POST, {
      method: "POST",
      path: "auth/login",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.c", password: "x" }),
    });

    const [target, options] = fetchSpy.mock.calls[0];
    expect(target).toBe(`${DELCOM_UPSTREAM}/auth/login`);
    expect(options.method).toBe("POST");
    expect(options.headers.get("content-type")).toBe("application/json");
    expect(new TextDecoder().decode(options.body)).toBe('{"email":"a@b.c","password":"x"}');
    expect(response.status).toBe(201);
  });

  it("keeps the upstream status for errors and omits missing content type", async () => {
    const upstream = new Response(null, { status: 404 });
    upstream.headers.delete("content-type");
    fetchSpy.mockResolvedValue(upstream);

    const response = await call(DELETE, { method: "DELETE", path: "courses/9" });

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBeNull();
  });

  it("returns 502 with a JSON message when the upstream is unreachable", async () => {
    fetchSpy.mockRejectedValue(new Error("network down"));

    const response = await call(GET, { path: "courses" });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      status: "fail",
      message: "Gagal menghubungi server API",
    });
  });
});
