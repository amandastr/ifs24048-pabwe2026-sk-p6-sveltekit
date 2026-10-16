import type { RequestHandler } from "./$types";

// Alamat API Delcom asli (diisi saat build dari VITE_DELCOM_BASEURL).
declare const DELCOM_UPSTREAM: string;

const FORWARDED_REQUEST_HEADERS = ["authorization", "content-type", "accept"];

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

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return new Response(
      JSON.stringify({ status: "fail", message: "Gagal menghubungi server API" }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
