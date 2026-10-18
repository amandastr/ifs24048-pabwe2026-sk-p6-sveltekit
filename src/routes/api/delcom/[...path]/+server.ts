import type { RequestHandler } from "./$types";

// Alamat API Delcom asli (diisi saat build dari VITE_DELCOM_BASEURL).
declare const DELCOM_UPSTREAM: string;

const FORWARDED_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
  "user-agent",
  "origin",
  "referer",
];

function failResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ status: "fail", message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Proxy sisi server: browser memanggil /api/delcom/*, server meneruskan
 * ke API Delcom. Dengan begitu tidak ada masalah CORS atau alamat API
 * yang salah di sisi browser.
 */
const proxy: RequestHandler = async ({ request, params, url }) => {
  const target = `${DELCOM_UPSTREAM}/${params.path}${url.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });

    const contentType = upstream.headers.get("content-type");

    // Error berbentuk HTML (bukan JSON) diubah menjadi pesan yang jelas.
    if (!upstream.ok && !(contentType || "").includes("json")) {
      return failResponse(
        `Server API Delcom mengembalikan status ${upstream.status}`,
        upstream.status
      );
    }

    const responseHeaders = new Headers();
    if (contentType) responseHeaders.set("content-type", contentType);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return failResponse("Gagal menghubungi server API", 502);
  }
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
