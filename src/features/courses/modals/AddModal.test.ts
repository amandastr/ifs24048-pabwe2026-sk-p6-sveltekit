import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";

const flush = () => new Promise((r) => setTimeout(r, 0));
const click = (el: any) => (el.element as HTMLElement).click();

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
  });

  it("does not render when show is false and unlocks body scroll", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("renders the form and locks body scroll when shown", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Tambah Kursus Baru");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("validates title and description before saving", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("Judul");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("submits trimmed values and shows the loading state", async () => {
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("  Belajar Svelte  ");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("  Dasar-dasar  ");
    await wrapper.find("form").trigger("submit");
    await flush();

    expect(addSpy).toHaveBeenCalledWith("Belajar Svelte", "Dasar-dasar");
    expect(wrapper.text()).toContain("Menyimpan...");
  });

  it("saves, clears the form, and closes after a successful add", async () => {
    vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true, onClose, onSaved } });

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("Deskripsi");
    await wrapper.find("form").trigger("submit");

    coursesStore.setFlag("isCourseAdded", true);
    coursesStore.setFlag("isCourseAdd", true);
    await flush();

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(coursesStore.$state.isCourseAdd).toBe(false);
    expect(coursesStore.$state.isCourseAdded).toBe(false);
    expect((wrapper.find('[data-testid="add-course-title-input"]').element as HTMLInputElement).value).toBe("");
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("stays open and stops loading after a failed add", async () => {
    vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true, onClose, onSaved } });

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("Deskripsi");
    await wrapper.find("form").trigger("submit");

    coursesStore.setFlag("isCourseAdd", true);
    await flush();

    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("closes through the close and cancel buttons", () => {
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true, onClose } });
    click(wrapper.find('[data-testid="close-add-modal-btn"]'));
    click(wrapper.find('[data-testid="cancel-add-modal-btn"]'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("works without optional callbacks", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    click(wrapper.find('[data-testid="cancel-add-modal-btn"]'));

    coursesStore.setFlag("isCourseAdded", true);
    coursesStore.setFlag("isCourseAdd", true);
    await flush();

    expect(coursesStore.$state.isCourseAdd).toBe(false);
  });
});
