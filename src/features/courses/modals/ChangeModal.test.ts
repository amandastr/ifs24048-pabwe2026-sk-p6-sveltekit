import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import courseApi from "../api/courseApi";
import { coursesStore } from "../states/coursesStore";

const flush = () => new Promise((r) => setTimeout(r, 0));
const click = (el: any) => (el.element as HTMLElement).click();
const value = (el: any) => (el.element as HTMLInputElement).value;

describe("ChangeModal", () => {
  let errorSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
  });

  it("does not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: false, courseId: 1 } });
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("does not fetch data when no course id is given", async () => {
    const getSpy = vi.spyOn(courseApi, "getCourseById");
    renderWithProviders(ChangeModal, { props: { show: true, courseId: null } });
    await flush();
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("shows a spinner while loading, then fills the form", async () => {
    let resolveCourse: (v: any) => void = () => {};
    vi.spyOn(courseApi, "getCourseById").mockReturnValue(new Promise((r) => (resolveCourse = r)));
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 4 } });
    await flush();

    expect(wrapper.find('[data-testid="edit-course-title-input"]').exists()).toBe(false);

    resolveCourse({ id: 4, title: "Judul Lama", description: "Deskripsi Lama" });
    await flush();

    expect(value(wrapper.find('[data-testid="edit-course-title-input"]'))).toBe("Judul Lama");
    expect(value(wrapper.find('[data-testid="edit-course-description-input"]'))).toBe("Deskripsi Lama");
  });

  it("falls back to empty strings when the course has no title or description", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 4 } as any);
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 4 } });
    await flush();

    expect(value(wrapper.find('[data-testid="edit-course-title-input"]'))).toBe("");
    expect(value(wrapper.find('[data-testid="edit-course-description-input"]'))).toBe("");
  });

  it("shows an error and closes when fetching fails", async () => {
    vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
    const onClose = vi.fn();
    renderWithProviders(ChangeModal, { props: { show: true, courseId: 4, onClose } });
    await flush();

    expect(errorSpy).toHaveBeenCalledWith("Gagal mengambil data kursus");
    expect(onClose).toHaveBeenCalled();
  });

  it("validates title and description", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 4, title: "A", description: "B" } as any);
    const changeSpy = vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue();
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 4 } });
    await flush();

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue("   ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="edit-course-description-input"]').setValue("   ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
    expect(changeSpy).not.toHaveBeenCalled();
  });

  it("submits the trimmed values and shows the loading state", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 4, title: "A", description: "B" } as any);
    const changeSpy = vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue();
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 4 } });
    await flush();

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue("  Baru  ");
    await wrapper.find('[data-testid="edit-course-description-input"]').setValue("  Deskripsi Baru ");
    await wrapper.find("form").trigger("submit");
    await flush();

    expect(changeSpy).toHaveBeenCalledWith(4, "Baru", "Deskripsi Baru");
    expect(wrapper.text()).toContain("Menyimpan...");
  });

  it("calls onSaved and onClose after a successful change", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 4, title: "A", description: "B" } as any);
    vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue();
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 4, onClose, onSaved } });
    await flush();

    await wrapper.find("form").trigger("submit");
    coursesStore.setFlag("isCourseChanged", true);
    coursesStore.setFlag("isCourseChange", true);
    await flush();

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(coursesStore.$state.isCourseChange).toBe(false);
    expect(coursesStore.$state.isCourseChanged).toBe(false);
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("stays open after a failed change", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 4, title: "A", description: "B" } as any);
    const onClose = vi.fn();
    const onSaved = vi.fn();
    renderWithProviders(ChangeModal, { props: { show: true, courseId: 4, onClose, onSaved } });
    await flush();

    coursesStore.setFlag("isCourseChange", true);
    await flush();

    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes via the buttons and works without callbacks", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 4, title: "A", description: "B" } as any);
    const onClose = vi.fn();
    const first = renderWithProviders(ChangeModal, { props: { show: true, courseId: 4, onClose } });
    await flush();
    click(first.wrapper.find('[data-testid="close-edit-modal-btn"]'));
    click(first.wrapper.find('[data-testid="cancel-edit-modal-btn"]'));
    expect(onClose).toHaveBeenCalledTimes(2);

    const second = renderWithProviders(ChangeModal, { props: { show: true, courseId: 4 } });
    await flush();
    click(second.wrapper.find('[data-testid="cancel-edit-modal-btn"]'));
    coursesStore.setFlag("isCourseChanged", true);
    coursesStore.setFlag("isCourseChange", true);
    await flush();
    expect(coursesStore.$state.isCourseChange).toBe(false);
  });
});
