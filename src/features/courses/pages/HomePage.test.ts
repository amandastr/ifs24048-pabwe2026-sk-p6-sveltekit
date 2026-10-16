import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";
import courseApi from "../api/courseApi";
import { mockGoto } from "../../../setupTests";

const flush = () => new Promise((r) => setTimeout(r, 0));
const click = (el: any) => (el.element as HTMLElement).click();
const profile = { id: 1, name: "Saya", email: "saya@del.org" };

const owned = {
  id: 10,
  user_id: 1,
  title: "Belajar Svelte",
  description: "Dasar Svelte 5",
  cover: "http://img/cover.jpg",
  author: { name: "Saya" },
  students: [2, 3],
  total_contents: 4,
  avg_ratings: "4.5000",
};
const joined = { id: 11, user_id: 9, title: "Belajar Go", description: "Dasar Go", author: { name: "Budi" }, students: [1], total_contents: 2, avg_ratings: null };
const other = { id: 12, user_id: 9, title: "Belajar Rust", description: "", author: { name: "Citra" }, students: [] };
const bare = { id: 13, user_id: 9 };

function setup(courses: any[] = [owned, joined, other], opts: any = {}) {
  const loadSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue(undefined as any);
  const rendered = renderWithProviders(HomePage, {
    preloadedState: { profile: "profile" in opts ? opts.profile : profile, courses },
  });
  return { ...rendered, loadSpy };
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGoto.mockClear();
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 10, title: "Belajar Svelte", description: "Dasar" } as any);
  });

  it("renders nothing until the profile is available", () => {
    const { wrapper } = setup([owned], { profile: null });
    expect(wrapper.text()).not.toContain("Daftar Kursus");
  });

  it("loads all courses on mount and renders them as cards", () => {
    const { wrapper, loadSpy } = setup();
    expect(loadSpy).toHaveBeenCalledWith("");
    expect(wrapper.text()).toContain("Daftar Kursus");
    expect(wrapper.find('[data-testid="course-card-10"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-card-11"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-card-12"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("4.5");
    expect(wrapper.text()).toContain("4 materi");
    expect(wrapper.text()).toContain("2 peserta");
  });

  it("shows a loading state while courses are being fetched", async () => {
    let resolveLoad: () => void = () => {};
    vi.spyOn(coursesStore, "asyncSetCourses").mockReturnValue(new Promise<void>((r) => (resolveLoad = r)) as any);
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses: [] } });
    await flush();
    expect(wrapper.text()).toContain("Memuat daftar kursus...");

    resolveLoad();
    await flush();
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
  });

  it("shows the empty state when there are no courses", async () => {
    const { wrapper } = setup([]);
    await flush();
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
  });

  it("marks ownership and enrollment, and limits edit/delete to owners", () => {
    const { wrapper } = setup();
    const ownedCard = wrapper.find('[data-testid="course-card-10"]');
    const joinedCard = wrapper.find('[data-testid="course-card-11"]');
    const otherCard = wrapper.find('[data-testid="course-card-12"]');

    expect(ownedCard.text()).toContain("Milik Saya");
    expect(joinedCard.text()).toContain("Terdaftar");
    expect(otherCard.text()).not.toContain("Milik Saya");
    expect(otherCard.text()).not.toContain("Terdaftar");

    expect(wrapper.find('[data-testid="edit-course-10"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-course-10"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-course-11"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="delete-course-12"]').exists()).toBe(false);
    expect(wrapper.find('img[alt="Belajar Svelte"]').exists()).toBe(true);
  });

  it("renders courses with missing optional fields", () => {
    const { wrapper } = setup([bare]);
    const card = wrapper.find('[data-testid="course-card-13"]');
    expect(card.exists()).toBe(true);
    expect(card.text()).toContain("0 materi");
    expect(card.text()).toContain("0 peserta");
    expect(card.text()).toContain("-");
  });

  it("filters by title, description, and author", async () => {
    const { wrapper } = setup([owned, joined, other, bare]);
    const input = wrapper.find('[data-testid="search-course-input"]');

    await input.setValue("svelte");
    expect(wrapper.find('[data-testid="course-card-10"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-card-11"]').exists()).toBe(false);

    await input.setValue("dasar go");
    expect(wrapper.find('[data-testid="course-card-11"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-card-10"]').exists()).toBe(false);

    await input.setValue("citra");
    expect(wrapper.find('[data-testid="course-card-12"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-card-11"]').exists()).toBe(false);

    await input.setValue("tidak ada");
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");

    await input.setValue("   ");
    expect(wrapper.find('[data-testid="course-card-13"]').exists()).toBe(true);
  });

  it("reloads with the owner filter when 'Milik Saya' is chosen", async () => {
    const { wrapper, loadSpy } = setup();

    click(wrapper.find('[data-testid="filter-mine-btn"]'));
    await flush();
    expect(loadSpy).toHaveBeenLastCalledWith("1");

    click(wrapper.find('[data-testid="filter-all-btn"]'));
    await flush();
    expect(loadSpy).toHaveBeenLastCalledWith("");
  });

  it("opens the detail page", () => {
    const { wrapper } = setup();
    click(wrapper.find('[data-testid="view-course-10"]'));
    expect(mockGoto).toHaveBeenCalledWith("/courses/10");
  });

  it("opens and closes the add modal and reloads after saving", async () => {
    const { wrapper, loadSpy } = setup();
    click(wrapper.find('[data-testid="add-course-btn"]'));
    await flush();
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(true);

    click(wrapper.find('[data-testid="close-add-modal-btn"]'));
    await flush();
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);

    click(wrapper.find('[data-testid="add-course-btn"]'));
    await flush();
    loadSpy.mockClear();
    coursesStore.setFlag("isCourseAdded", true);
    coursesStore.setFlag("isCourseAdd", true);
    await flush();
    expect(loadSpy).toHaveBeenCalled();
  });

  it("opens and closes the edit modal", async () => {
    const { wrapper } = setup();
    click(wrapper.find('[data-testid="edit-course-10"]'));
    await flush();
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(true);

    click(wrapper.find('[data-testid="close-edit-modal-btn"]'));
    await flush();
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
  });

  it("deletes a course only after confirmation", async () => {
    const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDelete").mockResolvedValue();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper } = setup();

    confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
    click(wrapper.find('[data-testid="delete-course-10"]'));
    await flush();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
    click(wrapper.find('[data-testid="delete-course-10"]'));
    await flush();
    expect(deleteSpy).toHaveBeenCalledWith(10);
  });

  it("deletes all owned courses only after confirmation", async () => {
    const deleteAllSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDeleteAll").mockResolvedValue();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper } = setup();

    confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
    click(wrapper.find('[data-testid="delete-all-courses-btn"]'));
    await flush();
    expect(deleteAllSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
    click(wrapper.find('[data-testid="delete-all-courses-btn"]'));
    await flush();
    expect(deleteAllSpy).toHaveBeenCalled();
  });

  it("hides 'Hapus Semua' when the user owns no course", () => {
    const { wrapper } = setup([joined, other]);
    expect(wrapper.find('[data-testid="delete-all-courses-btn"]').exists()).toBe(false);
  });

  it("reloads the list after a successful delete only", async () => {
    const { loadSpy } = setup();
    loadSpy.mockClear();

    coursesStore.setFlag("isCourseDelete", true);
    await flush();
    expect(loadSpy).not.toHaveBeenCalled();
    expect(coursesStore.$state.isCourseDelete).toBe(false);

    coursesStore.setFlag("isCourseDeleted", true);
    coursesStore.setFlag("isCourseDelete", true);
    await flush();
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(coursesStore.$state.isCourseDeleted).toBe(false);
  });
});
