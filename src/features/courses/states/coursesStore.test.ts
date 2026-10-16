import { describe, it, expect, vi, beforeEach } from "vitest";
import { coursesStore, useCoursesStore } from "./coursesStore";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

interface MutationCase {
  name: string;
  run: () => Promise<void>;
  api: keyof typeof courseApi;
  done: string;
  ok: string;
  fallback: string;
  returnsMessage: boolean;
}

const file = new File(["x"], "cover.png", { type: "image/png" });

const mutations: MutationCase[] = [
  { name: "asyncSetIsCourseAdd", run: () => coursesStore.asyncSetIsCourseAdd("T", "D"), api: "postCourse", done: "isCourseAdd", ok: "isCourseAdded", fallback: "Kursus berhasil ditambahkan!", returnsMessage: false },
  { name: "asyncSetIsCourseChange", run: () => coursesStore.asyncSetIsCourseChange(1, "T", "D"), api: "putCourse", done: "isCourseChange", ok: "isCourseChanged", fallback: "Kursus berhasil diubah!", returnsMessage: true },
  { name: "asyncSetIsCourseChangeCover", run: () => coursesStore.asyncSetIsCourseChangeCover(1, file), api: "postCourseCover", done: "isCourseChangeCover", ok: "isCourseChangedCover", fallback: "Sampul kursus berhasil diubah!", returnsMessage: true },
  { name: "asyncSetIsCourseDelete", run: () => coursesStore.asyncSetIsCourseDelete(1), api: "deleteCourse", done: "isCourseDelete", ok: "isCourseDeleted", fallback: "Kursus berhasil dihapus!", returnsMessage: true },
  { name: "asyncSetIsCourseDeleteAll", run: () => coursesStore.asyncSetIsCourseDeleteAll(), api: "deleteAllCourses", done: "isCourseDelete", ok: "isCourseDeleted", fallback: "Semua kursus berhasil dihapus!", returnsMessage: true },
  { name: "asyncSetIsCourseJoin", run: () => coursesStore.asyncSetIsCourseJoin(1), api: "postStudent", done: "isCourseStudentChange", ok: "isCourseStudentChanged", fallback: "Berhasil mendaftar pada kursus!", returnsMessage: true },
  { name: "asyncSetIsCourseLeave", run: () => coursesStore.asyncSetIsCourseLeave(1), api: "deleteStudent", done: "isCourseStudentChange", ok: "isCourseStudentChanged", fallback: "Berhasil keluar dari kursus!", returnsMessage: true },
  { name: "asyncSetIsCourseRatingChange", run: () => coursesStore.asyncSetIsCourseRatingChange(1, 5, "Bagus"), api: "putRatings", done: "isCourseRatingChange", ok: "isCourseRatingChanged", fallback: "Rating berhasil disimpan!", returnsMessage: true },
  { name: "asyncSetIsContentAdd", run: () => coursesStore.asyncSetIsContentAdd(1, "T", "https://youtu.be/uHyfQV0kbgo"), api: "postContent", done: "isContentAdd", ok: "isContentAdded", fallback: "Konten berhasil ditambahkan!", returnsMessage: false },
  { name: "asyncSetIsContentChange", run: () => coursesStore.asyncSetIsContentChange(1, "T", "https://youtu.be/uHyfQV0kbgo"), api: "putContent", done: "isContentChange", ok: "isContentChanged", fallback: "Konten berhasil diubah!", returnsMessage: true },
  { name: "asyncSetIsContentDelete", run: () => coursesStore.asyncSetIsContentDelete(1), api: "deleteContent", done: "isContentDelete", ok: "isContentDeleted", fallback: "Konten berhasil dihapus!", returnsMessage: true },
  { name: "asyncSetIsContentStatusChange", run: () => coursesStore.asyncSetIsContentStatusChange(1, 1), api: "postContentStatus", done: "isContentStatusChange", ok: "isContentStatusChanged", fallback: "Status belajar berhasil diubah!", returnsMessage: true },
];

describe("coursesStore", () => {
  beforeEach(() => {
    coursesStore.reset();
    vi.restoreAllMocks();
  });

  it("has the correct default state and exposes the same store", () => {
    const store = useCoursesStore();
    expect(store).toBe(coursesStore);
    expect(store.courses).toEqual([]);
    expect(store.course).toBeNull();
    expect(store.content).toBeNull();
    const { courses, course, content, ...flags } = store.$state;
    expect(Object.keys(flags).length).toBeGreaterThan(0);
    expect(Object.values(flags).every((value) => value === false)).toBe(true);
  });

  it("updates collections with setters", () => {
    coursesStore.setCourses([{ id: 1 } as any]);
    coursesStore.setCourse({ id: 2 } as any);
    coursesStore.setContent({ id: 3 } as any);
    expect(coursesStore.courses).toEqual([{ id: 1 }]);
    expect(coursesStore.course).toEqual({ id: 2 });
    expect(coursesStore.content).toEqual({ id: 3 });
  });

  it("updates any flag with setFlag", () => {
    coursesStore.setFlag("isCourseAdd", true);
    expect(coursesStore.$state.isCourseAdd).toBe(true);
    coursesStore.setFlag("isCourseAdd", false);
    expect(coursesStore.$state.isCourseAdd).toBe(false);
  });

  it("resets to the initial state with optional overrides", () => {
    coursesStore.setCourses([{ id: 1 } as any]);
    coursesStore.reset({ isCourse: true });
    expect(coursesStore.courses).toEqual([]);
    expect(coursesStore.$state.isCourse).toBe(true);
    coursesStore.reset();
    expect(coursesStore.$state.isCourse).toBe(false);
  });

  it("notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = coursesStore.subscribe(listener);
    coursesStore.setCourse({ id: 9 } as any);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ course: { id: 9 } }));
    unsubscribe();
  });

  describe("fetching", () => {
    it("loads courses and passes the isMe filter", async () => {
      const spy = vi.spyOn(courseApi, "getCourses").mockResolvedValue([{ id: 1 } as any]);
      await coursesStore.asyncSetCourses("1");
      expect(spy).toHaveBeenCalledWith("1");
      expect(coursesStore.courses).toEqual([{ id: 1 }]);
    });

    it("uses an empty filter by default and clears courses on failure", async () => {
      const spy = vi.spyOn(courseApi, "getCourses").mockRejectedValue(new Error("x"));
      coursesStore.setCourses([{ id: 1 } as any]);
      await coursesStore.asyncSetCourses();
      expect(spy).toHaveBeenCalledWith("");
      expect(coursesStore.courses).toEqual([]);
    });

    it("loads a course detail and raises isCourse", async () => {
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 2 } as any);
      await coursesStore.asyncSetCourse(2);
      expect(coursesStore.course).toEqual({ id: 2 });
      expect(coursesStore.$state.isCourse).toBe(true);
    });

    it("clears the course on failure and still raises isCourse", async () => {
      vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
      coursesStore.setCourse({ id: 2 } as any);
      await coursesStore.asyncSetCourse(2);
      expect(coursesStore.course).toBeNull();
      expect(coursesStore.$state.isCourse).toBe(true);
    });

    it("loads a content detail and raises isContent", async () => {
      vi.spyOn(courseApi, "getContentById").mockResolvedValue({ id: 3 } as any);
      await coursesStore.asyncSetContent(3);
      expect(coursesStore.content).toEqual({ id: 3 });
      expect(coursesStore.$state.isContent).toBe(true);
    });

    it("clears the content on failure and still raises isContent", async () => {
      vi.spyOn(courseApi, "getContentById").mockRejectedValue(new Error("x"));
      coursesStore.setContent({ id: 3 } as any);
      await coursesStore.asyncSetContent(3);
      expect(coursesStore.content).toBeNull();
      expect(coursesStore.$state.isContent).toBe(true);
    });
  });

  describe.each(mutations)("$name", (m) => {
    it("shows the API message and raises the done and ok flags on success", async () => {
      const success = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => Promise.resolve({} as any));
      vi.spyOn(courseApi, m.api as any).mockResolvedValue(m.returnsMessage ? "Pesan API" : { id: 1 });

      await m.run();

      expect(success).toHaveBeenCalledWith(m.returnsMessage ? "Pesan API" : m.fallback);
      expect((coursesStore.$state as any)[m.ok]).toBe(true);
      expect((coursesStore.$state as any)[m.done]).toBe(true);
    });

    it("uses the fallback message when the API returns an empty message", async () => {
      const success = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => Promise.resolve({} as any));
      vi.spyOn(courseApi, m.api as any).mockResolvedValue("");

      await m.run();

      expect(success).toHaveBeenCalledWith(m.fallback);
    });

    it("shows an error and keeps ok false on failure", async () => {
      const error = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
      vi.spyOn(courseApi, m.api as any).mockRejectedValue(new Error("Gagal"));
      coursesStore.setFlag(m.ok as any, true);

      await m.run();

      expect(error).toHaveBeenCalledWith("Gagal");
      expect((coursesStore.$state as any)[m.ok]).toBe(false);
      expect((coursesStore.$state as any)[m.done]).toBe(true);
    });
  });
});
