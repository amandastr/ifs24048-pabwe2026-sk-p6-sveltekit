import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentPage from "./ContentPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { coursesStore } from "../states/coursesStore";
import { mockGoto } from "../../../setupTests";

const flush = () => new Promise((r) => setTimeout(r, 0));
const click = (el: any) => (el.element as HTMLElement).click();
const profile = { id: 1, name: "Saya", email: "saya@del.org" };

const baseCourse = { id: 5, user_id: 9, title: "Dasar C", students: [] as number[] };
const baseContent = { id: 7, course_id: 5, title: "Pengenalan", youtube: "https://youtu.be/uHyfQV0kbgo", my_status_finished: false };

function setup(course: any, content: any, props: any = {}) {
  const courseSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(async () => {
    coursesStore.setCourse(course);
    coursesStore.setFlag("isCourse", true);
  });
  const contentSpy = vi.spyOn(coursesStore, "asyncSetContent").mockImplementation(async () => {
    coursesStore.setContent(content);
    coursesStore.setFlag("isContent", true);
  });
  const rendered = renderWithProviders(ContentPage, {
    props: { courseId: 5, contentId: 7, ...props },
    preloadedState: { profile },
  });
  return { ...rendered, courseSpy, contentSpy };
}

describe("ContentPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGoto.mockClear();
  });

  it("shows a spinner while loading", () => {
    vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue();
    vi.spyOn(coursesStore, "asyncSetContent").mockResolvedValue();
    const { wrapper } = renderWithProviders(ContentPage, { props: { courseId: 5, contentId: 7 }, preloadedState: { profile } });
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("loads the course and content on mount and clears the course flag", async () => {
    const { courseSpy, contentSpy } = setup(baseCourse, baseContent);
    await flush();
    expect(courseSpy).toHaveBeenCalledWith(5);
    expect(contentSpy).toHaveBeenCalledWith(7);
    expect(coursesStore.$state.isCourse).toBe(false);
    expect(coursesStore.$state.isContent).toBe(false);
  });

  it("goes back to the course when the content cannot be loaded", async () => {
    setup(baseCourse, null);
    await flush();
    expect(mockGoto).toHaveBeenCalledWith("/courses/5");
  });

  it("reloads when the content id changes", async () => {
    const { contentSpy, rerender } = setup(baseCourse, baseContent);
    await flush();
    await rerender({ courseId: 5, contentId: 8 });
    await flush();
    expect(contentSpy).toHaveBeenLastCalledWith(8);
  });

  it("embeds the YouTube player for a valid link", async () => {
    const { wrapper } = setup(baseCourse, baseContent);
    await flush();
    const frame = wrapper.find('[data-testid="youtube-player"]');
    expect(frame.attributes("src")).toBe("https://www.youtube.com/embed/uHyfQV0kbgo");
    expect(wrapper.text()).toContain("Dasar C");
    expect(wrapper.text()).toContain("Pengenalan");
    expect(wrapper.find('[data-testid="back-to-course-link"]').attributes("href")).toBe("/courses/5");
  });

  it("falls back to a link when the video cannot be embedded", async () => {
    const { wrapper } = setup(null, { ...baseContent, youtube: "https://example.com/x" });
    await flush();
    expect(wrapper.find('[data-testid="player-fallback"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="youtube-player"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Materi Kursus");
  });

  it("lets a student mark a content as finished and unfinished", async () => {
    const statusSpy = vi.spyOn(coursesStore, "asyncSetIsContentStatusChange").mockResolvedValue();
    const { wrapper } = setup({ ...baseCourse, students: [1] }, baseContent);
    await flush();

    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain("Belum selesai");
    click(wrapper.find('[data-testid="toggle-status-btn"]'));
    expect(statusSpy).toHaveBeenLastCalledWith(7, 1);

    const finished = setup({ ...baseCourse, students: [1] }, { ...baseContent, my_status_finished: true });
    await flush();
    expect(finished.wrapper.find('[data-testid="status-badge"]').text()).toContain("Selesai");
    expect(finished.wrapper.text()).toContain("Tandai Belum Selesai");
    click(finished.wrapper.find('[data-testid="toggle-status-btn"]'));
    expect(statusSpy).toHaveBeenLastCalledWith(7, 0);
  });

  it("reloads the content after the status changes successfully", async () => {
    const { contentSpy } = setup({ ...baseCourse, students: [1] }, baseContent);
    await flush();
    contentSpy.mockClear();

    coursesStore.setFlag("isContentStatusChange", true);
    await flush();
    expect(contentSpy).not.toHaveBeenCalled();

    coursesStore.setFlag("isContentStatusChanged", true);
    coursesStore.setFlag("isContentStatusChange", true);
    await flush();
    expect(contentSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a note instead of the toggle for owners and guests", async () => {
    const asOwner = setup({ ...baseCourse, user_id: 1, students: [1] }, baseContent);
    await flush();
    expect(asOwner.wrapper.find('[data-testid="owner-note"]').exists()).toBe(true);
    expect(asOwner.wrapper.find('[data-testid="toggle-status-btn"]').exists()).toBe(false);

    const asGuest = setup(baseCourse, baseContent);
    await flush();
    expect(asGuest.wrapper.find('[data-testid="guest-note"]').exists()).toBe(true);
  });
});
