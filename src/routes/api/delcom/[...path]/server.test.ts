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
      headers: { authorization: "Bearer abc", cookie: "secret=1", "user-agent": "Mozilla/5.0 Test" },
    });

    const [target, options] = fetchSpy.mock.calls[0];
    expect(target).toBe(`${DELCOM_UPSTREAM}/courses?is_me=1`);
    expect(options.method).toBe("GET");
    expect(options.body).toBeUndefined();
    expect(options.headers.get("authorization")).toBe("Bearer abc");
    expect(options.headers.get("cookie")).toBeNull();
    expect(options.headers.get("user-agent")).toBe("Mozilla/5.0 Test");

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

  it("keeps a JSON error response from the upstream as is", async () => {
    fetchSpy.mockResolvedValue(
      new Response('{"status":"fail","message":"Tidak ditemukan"}', {
        status: 404,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await call(DELETE, { method: "DELETE", path: "courses/9" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ status: "fail", message: "Tidak ditemukan" });
  });

  it("turns an HTML error page from the upstream into a clear JSON message", async () => {
    fetchSpy.mockResolvedValue(
      new Response("<html><head><title>403 Forbidden</title></head></html>", {
        status: 403,
        headers: { "content-type": "text/html" },
      })
    );

    const response = await call(POST, { method: "POST", path: "auth/login", body: "{}" });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      status: "fail",
      message: "Server API Delcom mengembalikan status 403",
    });
  });

  it("handles an upstream error without any content type", async () => {
    const upstream = new Response(null, { status: 500 });
    upstream.headers.delete("content-type");
    fetchSpy.mockResolvedValue(upstream);

    const response = await call(GET, { path: "courses" });

    expect(response.status).toBe(500);
    expect((await response.json()).message).toContain("500");
  });

  it("omits the content type of a successful empty response", async () => {
    const upstream = new Response(null, { status: 204 });
    upstream.headers.delete("content-type");
    fetchSpy.mockResolvedValue(upstream);

    const response = await call(GET, { path: "courses" });

    expect(response.status).toBe(204);
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
