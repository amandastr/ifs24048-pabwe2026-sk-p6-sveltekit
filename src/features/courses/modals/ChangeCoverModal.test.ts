import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeCoverModal from "./ChangeCoverModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";

const flush = () => new Promise((r) => setTimeout(r, 0));
const click = (el: any) => (el.element as HTMLElement).click();
const course = { id: 1, user_id: 1, title: "Kursus", description: "Desk" };

async function selectFile(wrapper: any, files: any) {
  const input = wrapper.find('[data-testid="cover-file-input"]');
  Object.defineProperty(input.element, "files", { value: files, configurable: true });
  await input.trigger("change");
}

describe("ChangeCoverModal", () => {
  let errorSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
  });

  it("does not render when hidden or when there is no course", () => {
    const hidden = renderWithProviders(ChangeCoverModal, { props: { show: false, course } });
    expect(hidden.wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");

    const noCourse = renderWithProviders(ChangeCoverModal, { props: { show: true, course: null } });
    expect(noCourse.wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("requires a file before saving", async () => {
    const { wrapper } = renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Silakan pilih sampul baru!");
  });

  it("validates the selected file", async () => {
    const { wrapper } = renderWithProviders(ChangeCoverModal, { props: { show: true, course } });

    await selectFile(wrapper, []);
    expect(errorSpy).not.toHaveBeenCalled();

    await selectFile(wrapper, [new File(["x"], "doc.pdf", { type: "application/pdf" })]);
    expect(errorSpy).toHaveBeenCalledWith("Pilih file gambar (JPG/PNG)!");

    await selectFile(wrapper, [new File([new Uint8Array(2 * 1024 * 1024)], "big.png", { type: "image/png" })]);
    expect(errorSpy).toHaveBeenCalledWith("Ukuran gambar maksimal 1MB!");
    expect(wrapper.find('img[alt="Pratinjau"]').exists()).toBe(false);
  });

  it("previews a valid image and uploads it", async () => {
    const uploadSpy = vi.spyOn(coursesStore, "asyncSetIsCourseChangeCover").mockResolvedValue();
    const { wrapper } = renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    const valid = new File(["x"], "cover.jpg", { type: "image/jpeg" });

    await selectFile(wrapper, [valid]);
    expect(wrapper.find('img[alt="Pratinjau"]').exists()).toBe(true);

    await wrapper.find("form").trigger("submit");
    await flush();

    expect(uploadSpy).toHaveBeenCalledWith(1, valid);
    expect(wrapper.text()).toContain("Mengunggah...");
  });

  it("calls onSaved and onClose after a successful upload", async () => {
    vi.spyOn(coursesStore, "asyncSetIsCourseChangeCover").mockResolvedValue();
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const { wrapper } = renderWithProviders(ChangeCoverModal, { props: { show: true, course, onClose, onSaved } });

    await selectFile(wrapper, [new File(["x"], "cover.jpg", { type: "image/jpeg" })]);
    await wrapper.find("form").trigger("submit");

    coursesStore.setFlag("isCourseChangedCover", true);
    coursesStore.setFlag("isCourseChangeCover", true);
    await flush();

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(coursesStore.$state.isCourseChangeCover).toBe(false);
    expect(coursesStore.$state.isCourseChangedCover).toBe(false);
    expect(wrapper.find('img[alt="Pratinjau"]').exists()).toBe(false);
  });

  it("stays open after a failed upload", async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    renderWithProviders(ChangeCoverModal, { props: { show: true, course, onClose, onSaved } });

    coursesStore.setFlag("isCourseChangeCover", true);
    await flush();

    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes via the buttons and works without callbacks", async () => {
    const onClose = vi.fn();
    const first = renderWithProviders(ChangeCoverModal, { props: { show: true, course, onClose } });
    click(first.wrapper.find('[data-testid="close-cover-modal-btn"]'));
    click(first.wrapper.find('[data-testid="cancel-cover-modal-btn"]'));
    expect(onClose).toHaveBeenCalledTimes(2);

    const second = renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    click(second.wrapper.find('[data-testid="cancel-cover-modal-btn"]'));
    coursesStore.setFlag("isCourseChangedCover", true);
    coursesStore.setFlag("isCourseChangeCover", true);
    await flush();
    expect(coursesStore.$state.isCourseChangeCover).toBe(false);
  });
});
