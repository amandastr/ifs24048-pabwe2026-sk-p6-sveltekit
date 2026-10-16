import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";
import courseApi from "../api/courseApi";
import { mockGoto } from "../../../setupTests";

const flush = () => new Promise((r) => setTimeout(r, 0));
const click = (el: any) => (el.element as HTMLElement).click();
const profile = { id: 1, name: "Saya", email: "saya@del.org" };

function makeCourse(over: any = {}) {
  return {
    id: 5,
    user_id: 9,
    title: "Dasar C",
    description: "Belajar C",
    cover: "http://img/c.jpg",
    author: { name: "Budi" },
    students: [],
    total_contents: 2,
    avg_ratings: "4.00",
    my_percentage_finished: "50.00",
    created_at: "2024-10-06T00:40:35.000000Z",
    updated_at: "2024-10-06T00:40:35.000000Z",
    contents: [
      { id: 1, course_id: 5, title: "Materi A", youtube: "https://youtu.be/uHyfQV0kbgo", my_status_finished: true },
      { id: 2, course_id: 5, title: "Materi B", youtube: "https://youtu.be/uHyfQV0kbgo", my_status_finished: false },
    ],
    ratings: [
      { name: "Citra", ratings: 4, comment: "Keren" },
      { name: "", ratings: 2, comment: null },
    ],
    ...over,
  };
}

const owner = () => makeCourse({ user_id: 1 });
const student = () => makeCourse({ students: [1] });
const guest = () => makeCourse();

function setup(course: any, props: any = {}) {
  const loadSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(async () => {
    coursesStore.setCourse(course);
    coursesStore.setFlag("isCourse", true);
  });
  const rendered = renderWithProviders(DetailPage, { props: { courseId: 5, ...props }, preloadedState: { profile } });
  return { ...rendered, loadSpy };
}

describe("DetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGoto.mockClear();
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 5, title: "Dasar C", description: "x" } as any);
  });

  it("shows a spinner while the course is loading", () => {
    vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue();
    const { wrapper } = renderWithProviders(DetailPage, { props: { courseId: 5 }, preloadedState: { profile } });
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("keeps showing the spinner when a course is loaded but the profile is not", async () => {
    vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(async () => {
      coursesStore.setCourse(guest());
    });
    const { wrapper } = renderWithProviders(DetailPage, { props: { courseId: 5 }, preloadedState: { profile: null } });
    await flush();
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Dasar C");
  });

  it("redirects home when the course cannot be loaded", async () => {
    vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(async () => {
      coursesStore.setCourse(null);
      coursesStore.setFlag("isCourse", true);
    });
    renderWithProviders(DetailPage, { props: { courseId: 5 }, preloadedState: { profile } });
    await flush();
    expect(mockGoto).toHaveBeenCalledWith("/");
  });

  it("loads the course on mount and again when the id changes", async () => {
    const { loadSpy, rerender } = setup(guest());
    await flush();
    expect(loadSpy).toHaveBeenCalledWith(5);

    await rerender({ courseId: 6 });
    await flush();
    expect(loadSpy).toHaveBeenLastCalledWith(6);
  });

  it("renders course information", async () => {
    const { wrapper } = setup(guest());
    await flush();
    expect(wrapper.text()).toContain("Dasar C");
    expect(wrapper.text()).toContain("Budi");
    expect(wrapper.text()).toContain("Belajar C");
    expect(wrapper.text()).toContain("4.0");
    expect(wrapper.find('img[alt="Dasar C"]').exists()).toBe(true);
  });

  it("handles a course without cover, description, author, or counts", async () => {
    const { wrapper } = setup(
      makeCourse({ cover: null, description: "", author: undefined, students: undefined, total_contents: undefined, contents: undefined, ratings: undefined, avg_ratings: null })
    );
    await flush();
    expect(wrapper.find('img[alt="Dasar C"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Tidak ada deskripsi untuk kursus ini.");
    expect(wrapper.text()).toContain("Belum ada materi pada kursus ini.");
    expect(wrapper.text()).toContain("Belum ada rating untuk kursus ini.");
  });

  describe("owner", () => {
    it("shows owner controls only", async () => {
      const { wrapper } = setup(makeCourse({ user_id: 1, students: [1] }));
      await flush();
      expect(wrapper.find('[data-testid="role-badge"]').text()).toContain("Pemilik Kursus");
      expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="add-content-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="leave-course-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="join-course-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="rating-form"]').exists()).toBe(false);
    });

    it("opens and closes the cover, edit, and content modals", async () => {
      const { wrapper } = setup(owner());
      await flush();

      click(wrapper.find('[data-testid="edit-cover-btn"]'));
      await flush();
      expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);
      click(wrapper.find('[data-testid="close-cover-modal-btn"]'));
      await flush();
      expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);

      click(wrapper.find('[data-testid="edit-detail-course-btn"]'));
      await flush();
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(true);
      click(wrapper.find('[data-testid="close-edit-modal-btn"]'));
      await flush();
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);

      click(wrapper.find('[data-testid="add-content-btn"]'));
      await flush();
      expect(wrapper.find('[data-testid="content-modal"]').text()).toContain("Tambah Konten");
      click(wrapper.find('[data-testid="close-content-modal-btn"]'));
      await flush();

      click(wrapper.find('[data-testid="edit-content-1"]'));
      await flush();
      expect(wrapper.find('[data-testid="content-modal"]').text()).toContain("Ubah Konten");
    });

    it("refreshes the course after a modal saves", async () => {
      const { wrapper, loadSpy } = setup(owner());
      await flush();
      click(wrapper.find('[data-testid="edit-cover-btn"]'));
      await flush();
      loadSpy.mockClear();
      coursesStore.setFlag("isCourseChangedCover", true);
      coursesStore.setFlag("isCourseChangeCover", true);
      await flush();
      expect(loadSpy).toHaveBeenCalled();
    });

    it("deletes the course only after confirmation, then goes home", async () => {
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper } = setup(owner());
      await flush();

      confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
      click(wrapper.find('[data-testid="delete-detail-course-btn"]'));
      await flush();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
      click(wrapper.find('[data-testid="delete-detail-course-btn"]'));
      await flush();
      expect(deleteSpy).toHaveBeenCalledWith(5);

      coursesStore.setFlag("isCourseDelete", true);
      await flush();
      expect(mockGoto).not.toHaveBeenCalledWith("/");

      coursesStore.setFlag("isCourseDeleted", true);
      coursesStore.setFlag("isCourseDelete", true);
      await flush();
      expect(mockGoto).toHaveBeenCalledWith("/");
    });

    it("deletes a content only after confirmation and refreshes", async () => {
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsContentDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper, loadSpy } = setup(owner());
      await flush();

      confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
      click(wrapper.find('[data-testid="delete-content-1"]'));
      await flush();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
      click(wrapper.find('[data-testid="delete-content-1"]'));
      await flush();
      expect(deleteSpy).toHaveBeenCalledWith(1);

      loadSpy.mockClear();
      coursesStore.setFlag("isContentDelete", true);
      await flush();
      expect(loadSpy).not.toHaveBeenCalled();

      coursesStore.setFlag("isContentDeleted", true);
      coursesStore.setFlag("isContentDelete", true);
      await flush();
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it("opens a content page", async () => {
      const { wrapper } = setup(owner());
      await flush();
      click(wrapper.find('[data-testid="open-content-2"]'));
      expect(mockGoto).toHaveBeenCalledWith("/courses/5/contents/2");
    });
  });

  describe("student", () => {
    it("shows progress, statuses, and the rating form without owner controls", async () => {
      const { wrapper } = setup(student());
      await flush();
      expect(wrapper.find('[data-testid="role-badge"]').text()).toContain("Peserta");
      expect(wrapper.find('[data-testid="progress-label"]').text()).toBe("50%");
      expect(wrapper.find('[data-testid="content-row-1"]').text()).toContain("Selesai");
      expect(wrapper.find('[data-testid="content-row-2"]').text()).toContain("Belum selesai");
      expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="edit-content-1"]').exists()).toBe(false);
      expect(wrapper.text()).toContain("Beri rating untuk kursus ini");
    });

    it("shows zero progress when none is reported", async () => {
      const { wrapper } = setup(makeCourse({ students: [1], my_percentage_finished: null }));
      await flush();
      expect(wrapper.find('[data-testid="progress-label"]').text()).toBe("0%");
    });

    it("leaves the course only after confirmation and refreshes on success", async () => {
      const leaveSpy = vi.spyOn(coursesStore, "asyncSetIsCourseLeave").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper, loadSpy } = setup(student());
      await flush();

      confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
      click(wrapper.find('[data-testid="leave-course-btn"]'));
      await flush();
      expect(leaveSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
      click(wrapper.find('[data-testid="leave-course-btn"]'));
      await flush();
      expect(leaveSpy).toHaveBeenCalledWith(5);

      loadSpy.mockClear();
      coursesStore.setFlag("isCourseStudentChange", true);
      await flush();
      expect(loadSpy).not.toHaveBeenCalled();

      coursesStore.setFlag("isCourseStudentChanged", true);
      coursesStore.setFlag("isCourseStudentChange", true);
      await flush();
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it("submits a rating and refreshes on success", async () => {
      const rateSpy = vi.spyOn(coursesStore, "asyncSetIsCourseRatingChange").mockResolvedValue();
      const { wrapper, loadSpy } = setup(student());
      await flush();

      const select = wrapper.find('[data-testid="rating-select"]');
      (select.element as HTMLSelectElement).value = "4";
      await select.trigger("change");
      await wrapper.find('[data-testid="rating-comment-input"]').setValue("  Bagus  ");
      await wrapper.find('[data-testid="rating-form"]').trigger("submit");
      expect(rateSpy).toHaveBeenCalledWith(5, 4, "Bagus");

      loadSpy.mockClear();
      coursesStore.setFlag("isCourseRatingChange", true);
      await flush();
      expect(loadSpy).not.toHaveBeenCalled();

      coursesStore.setFlag("isCourseRatingChanged", true);
      coursesStore.setFlag("isCourseRatingChange", true);
      await flush();
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it("prefills the form with the user's existing rating", async () => {
      const mine = makeCourse({ students: [1], ratings: [{ name: "Saya", ratings: 3, comment: "Cukup" }] });
      const { wrapper } = setup(mine);
      await flush();
      expect(wrapper.text()).toContain("Ubah rating Anda");
      expect((wrapper.find('[data-testid="rating-select"]').element as HTMLSelectElement).value).toBe("3");
      expect((wrapper.find('[data-testid="rating-comment-input"]').element as HTMLInputElement).value).toBe("Cukup");
    });

    it("prefills an empty comment when the existing rating has none", async () => {
      const mine = makeCourse({ students: [1], ratings: [{ name: "Saya", ratings: 5, comment: null }] });
      const { wrapper } = setup(mine);
      await flush();
      expect((wrapper.find('[data-testid="rating-comment-input"]').element as HTMLInputElement).value).toBe("");
    });
  });

  describe("guest", () => {
    it("can join the course and sees locked contents", async () => {
      const joinSpy = vi.spyOn(coursesStore, "asyncSetIsCourseJoin").mockResolvedValue();
      const { wrapper } = setup(guest());
      await flush();

      expect(wrapper.find('[data-testid="role-badge"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="locked-content-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="open-content-1"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="rating-form"]').exists()).toBe(false);

      click(wrapper.find('[data-testid="join-course-btn"]'));
      expect(joinSpy).toHaveBeenCalledWith(5);
    });
  });

  it("lists ratings with comments and initials", async () => {
    const { wrapper } = setup(guest());
    await flush();
    expect(wrapper.find('[data-testid="rating-row-0"]').text()).toContain("Citra");
    expect(wrapper.find('[data-testid="rating-row-0"]').text()).toContain("Keren");
    expect(wrapper.find('[data-testid="rating-row-1"]').text()).toContain("U");
  });
});
