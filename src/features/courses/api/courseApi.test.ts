import { describe, it, expect, vi, beforeEach } from "vitest";
import courseApi from "./courseApi";
import apiHelper from "../../../helpers/apiHelper";

declare const DELCOM_BASEURL: string;
const BASE = `${DELCOM_BASEURL}/courses`;

function mockResponse(body: any) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({ json: async () => body } as any);
}

interface Case {
  name: string;
  call: () => Promise<any>;
  url: string;
  method: string;
  body?: any;
  success: any;
  expected: any;
  fallback: string;
}

const cases: Case[] = [
  {
    name: "postCourse",
    call: () => courseApi.postCourse("Judul", "Deskripsi"),
    url: "/",
    method: "POST",
    body: { title: "Judul", description: "Deskripsi" },
    success: { status: "success", data: { course_id: 5 } },
    expected: { course_id: 5 },
    fallback: "Gagal menambahkan kursus",
  },
  {
    name: "putCourse",
    call: () => courseApi.putCourse(3, "Judul", "Deskripsi"),
    url: "/3",
    method: "PUT",
    body: { title: "Judul", description: "Deskripsi" },
    success: { status: "success", message: "Berhasil mengubah data" },
    expected: "Berhasil mengubah data",
    fallback: "Gagal mengubah kursus",
  },
  {
    name: "getCourseById",
    call: () => courseApi.getCourseById(3),
    url: "/3",
    method: "GET",
    success: { status: "success", data: { course: { id: 3 } } },
    expected: { id: 3 },
    fallback: "Gagal mengambil detail kursus",
  },
  {
    name: "deleteCourse",
    call: () => courseApi.deleteCourse(3),
    url: "/3",
    method: "DELETE",
    success: { status: "success", message: "Berhasil menghapus data" },
    expected: "Berhasil menghapus data",
    fallback: "Gagal menghapus kursus",
  },
  {
    name: "deleteAllCourses",
    call: () => courseApi.deleteAllCourses(),
    url: "/",
    method: "DELETE",
    success: { status: "success", message: "Berhasil menghapus semua data kursus" },
    expected: "Berhasil menghapus semua data kursus",
    fallback: "Gagal menghapus semua kursus",
  },
  {
    name: "postStudent",
    call: () => courseApi.postStudent(3),
    url: "/3/students",
    method: "POST",
    success: { status: "success", message: "Berhasil menjadi pelajar pada kursus" },
    expected: "Berhasil menjadi pelajar pada kursus",
    fallback: "Gagal mendaftar pada kursus",
  },
  {
    name: "deleteStudent",
    call: () => courseApi.deleteStudent(3),
    url: "/3/students",
    method: "DELETE",
    success: { status: "success", message: "Berhasil keluar sebagai pelajar pada kursus" },
    expected: "Berhasil keluar sebagai pelajar pada kursus",
    fallback: "Gagal keluar dari kursus",
  },
  {
    name: "putRatings",
    call: () => courseApi.putRatings(3, "4" as any, "Keren"),
    url: "/3/students/ratings",
    method: "PUT",
    body: { ratings: 4, comment: "Keren" },
    success: { status: "success", message: "Berhasil mengubah ratings pada kursus" },
    expected: "Berhasil mengubah ratings pada kursus",
    fallback: "Gagal mengubah rating kursus",
  },
  {
    name: "postContent",
    call: () => courseApi.postContent(3, "Materi", "https://youtu.be/uHyfQV0kbgo"),
    url: "/3/contents",
    method: "POST",
    body: { title: "Materi", youtube: "https://youtu.be/uHyfQV0kbgo" },
    success: { status: "success", data: { content_id: 8 } },
    expected: { content_id: 8 },
    fallback: "Gagal menambahkan konten",
  },
  {
    name: "putContent",
    call: () => courseApi.putContent(8, "Materi", "https://youtu.be/uHyfQV0kbgo"),
    url: "/-/contents/8",
    method: "PUT",
    body: { title: "Materi", youtube: "https://youtu.be/uHyfQV0kbgo" },
    success: { status: "success", message: "Berhasil mengubah konten kursus" },
    expected: "Berhasil mengubah konten kursus",
    fallback: "Gagal mengubah konten",
  },
  {
    name: "getContentById",
    call: () => courseApi.getContentById(8),
    url: "/-/contents/8",
    method: "GET",
    success: { status: "success", data: { course_content: { id: 8 } } },
    expected: { id: 8 },
    fallback: "Gagal mengambil detail konten",
  },
  {
    name: "deleteContent",
    call: () => courseApi.deleteContent(8),
    url: "/-/contents/8",
    method: "DELETE",
    success: { status: "success", message: "Berhasil menghapus konten kursus" },
    expected: "Berhasil menghapus konten kursus",
    fallback: "Gagal menghapus konten",
  },
  {
    name: "postContentStatus",
    call: () => courseApi.postContentStatus(8, 1),
    url: "/-/contents/8/learns",
    method: "POST",
    body: { status: 1 },
    success: { status: "success", message: "Berhasil mengubah status" },
    expected: "Berhasil mengubah status",
    fallback: "Gagal mengubah status belajar",
  },
  {
    name: "getCourses",
    call: () => courseApi.getCourses(),
    url: "/",
    method: "GET",
    success: { status: "success", data: { courses: [{ id: 1 }] } },
    expected: [{ id: 1 }],
    fallback: "Gagal mengambil data kursus",
  },
];

describe("courseApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe.each(cases)("$name", (c) => {
    it("sends the correct request and returns the result", async () => {
      const spy = mockResponse(c.success);

      await expect(c.call()).resolves.toEqual(c.expected);

      const [url, options] = spy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(BASE + c.url);
      expect(options.method).toBe(c.method);
      if (c.body) {
        expect(JSON.parse(options.body as string)).toEqual(c.body);
        expect((options.headers as any)["Content-Type"]).toBe("application/json");
      }
    });

    it("throws the API message when the status is not success", async () => {
      mockResponse({ status: "fail", message: "Data tidak valid" });
      await expect(c.call()).rejects.toThrow("Data tidak valid");
    });

    it("throws the fallback message when the API gives none", async () => {
      mockResponse({ status: "fail" });
      await expect(c.call()).rejects.toThrow(c.fallback);
    });
  });

  describe("getCourses", () => {
    it("requests only my courses when isMe is set", async () => {
      const spy = mockResponse({ status: "success", data: { courses: [] } });
      await courseApi.getCourses("1");
      expect(spy.mock.calls[0][0]).toBe(`${BASE}/?is_me=1`);
    });

    it("requests all courses when isMe is empty or false", async () => {
      const spy = mockResponse({ status: "success", data: { courses: [] } });
      await courseApi.getCourses("");
      await courseApi.getCourses(false);
      expect(spy.mock.calls[0][0]).toBe(`${BASE}/`);
      expect(spy.mock.calls[1][0]).toBe(`${BASE}/`);
    });

    it("returns an empty list when data is missing", async () => {
      mockResponse({ status: "success" });
      await expect(courseApi.getCourses()).resolves.toEqual([]);
    });
  });

  describe("missing data", () => {
    it("returns undefined when course data is missing", async () => {
      mockResponse({ status: "success" });
      await expect(courseApi.getCourseById(1)).resolves.toBeUndefined();
    });

    it("returns undefined when content data is missing", async () => {
      mockResponse({ status: "success" });
      await expect(courseApi.getContentById(1)).resolves.toBeUndefined();
    });
  });

  describe("postCourseCover", () => {
    it("uploads the cover as FormData and returns the message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah cover" });
      const file = new File(["x"], "cover.png", { type: "image/png" });

      await expect(courseApi.postCourseCover(3, file)).resolves.toBe("Berhasil mengubah cover");

      const [url, options] = spy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/3/cover`);
      expect(options.method).toBe("POST");
      const form = options.body as FormData;
      expect((form.get("cover") as File).name).toBe("cover.png");
    });

    it("falls back to cover.jpg when the file has no name", async () => {
      const spy = mockResponse({ status: "success", message: "ok" });
      await courseApi.postCourseCover(3, new File(["x"], "", { type: "image/png" }));
      const form = (spy.mock.calls[0][1] as RequestInit).body as FormData;
      expect((form.get("cover") as File).name).toBe("cover.jpg");
    });

    it("throws the API message or the fallback on failure", async () => {
      const file = new File(["x"], "cover.png");
      mockResponse({ status: "fail", message: "Berkas tidak valid" });
      await expect(courseApi.postCourseCover(3, file)).rejects.toThrow("Berkas tidak valid");

      mockResponse({ status: "fail" });
      await expect(courseApi.postCourseCover(3, file)).rejects.toThrow("Gagal mengubah sampul kursus");
    });
  });

  describe("postContentStatus", () => {
    it("maps the status to 1 or 0", async () => {
      const spy = mockResponse({ status: "success", message: "ok" });
      await courseApi.postContentStatus(8, 0);
      await courseApi.postContentStatus(8, true);
      expect(JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)).toEqual({ status: 0 });
      expect(JSON.parse((spy.mock.calls[1][1] as RequestInit).body as string)).toEqual({ status: 1 });
    });
  });
});
