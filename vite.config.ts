import { sveltekit } from "@sveltejs/kit/vite";
import adapterBun from "@sveltejs/adapter-bun";
import adapterVercel from "@sveltejs/adapter-vercel";
import tailwindcss from "@tailwindcss/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig, loadEnv } from "vite";
import process from "process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(process.env.APP_PORT || env.APP_PORT) || 3005;

  // Di Vercel variabel VERCEL otomatis bernilai "1".
  // Di tempat lain (lokal, tugas) tetap memakai adapter-bun.
  const adapter = process.env.VERCEL
    ? adapterVercel()
    : adapterBun({
        envPrefix: "APP_",
        serverOptions: {
          port: port,
        },
      });

  // Alamat API: dari VITE_DELCOM_BASEURL (.env atau environment Vercel),
  // bila kosong memakai API Delcom publik agar aplikasi tetap berjalan.
  const baseUrl =
    process.env.VITE_DELCOM_BASEURL ||
    env.VITE_DELCOM_BASEURL ||
    "https://open-api.delcom.org/api/v1";

  return {
    plugins: [
      sveltekit({
        adapter,
        // Inline semua CSS ke <head> agar tidak ada file CSS yang memblokir render
        inlineStyleThreshold: Infinity,
      }),
      tailwindcss(),
      svelteTesting(),
    ],
    server: {
      port: port,
    },
    preview: {
      port: port,
    },
    build: {
      chunkSizeWarningLimit: 1500,
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(baseUrl),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        include: ["src/**/*.{js,ts,svelte}"],
        exclude: [
          "src/app.d.ts",
          "src/env.d.ts",
          "src/setupTests.ts",
          "src/test-utils.ts",
          "**/*.test.{js,ts}",
          "node_modules/**",
          ".svelte-kit/**",
          ".docs/**",
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  };
});