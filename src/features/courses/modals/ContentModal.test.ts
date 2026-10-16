import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentModal from "./ContentModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";

const flush = () => new Promise((r) => setTimeout(r, 0));
const click = (el: any) => (el.element as HTMLElement).click();
const value = (el: any) => (el.element as HTMLInputElement).value;
const YT = "https://youtu.be/uHyfQV0kbgo";
const content = { id: 8, course_id: 1, title: "Materi Lama", youtube: "https://youtu.be/aaaaaaaaaaa" };

describe("ContentModal", () => {
  let errorSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
  });

  it("does not render when show is false", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: false, courseId: 1 } });
    expect(wrapper.find('[data-testid="content-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  describe("add mode", () => {
    it("renders an empty form", () => {
      const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });
      expect(wrapper.text()).toContain("Tambah Konten");
      expect(value(wrapper.find('[data-testid="content-title-input"]'))).toBe("");
      expect(value(wrapper.find('[data-testid="content-youtube-input"]'))).toBe("");
    });

    it("validates the title and the YouTube link", async () => {
      const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();
      const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });

      await wrapper.find("form").trigger("submit");
      expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

      await wrapper.find('[data-testid="content-title-input"]').setValue("Materi");
      await wrapper.find('[data-testid="content-youtube-input"]').setValue("https://example.com/video");
      await wrapper.find("form").trigger("submit");
      expect(errorSpy).toHaveBeenCalledWith("Tautan YouTube tidak valid");
      expect(addSpy).not.toHaveBeenCalled();
    });

    it("submits a new content with trimmed values", async () => {
      const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();
      const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });

      await wrapper.find('[data-testid="content-title-input"]').setValue("  Materi Baru  ");
      await wrapper.find('[data-testid="content-youtube-input"]').setValue(`  ${YT}  `);
      await wrapper.find("form").trigger("submit");
      await flush();

      expect(addSpy).toHaveBeenCalledWith(1, "Materi Baru", YT);
      expect(wrapper.text()).toContain("Menyimpan...");
    });

    it("calls onSaved and onClose after a successful add", async () => {
      const onClose = vi.fn();
      const onSaved = vi.fn();
      renderWithProviders(ContentModal, { props: { show: true, courseId: 1, onClose, onSaved } });

      coursesStore.setFlag("isContentAdded", true);
      coursesStore.setFlag("isContentAdd", true);
      await flush();

      expect(onSaved).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(coursesStore.$state.isContentAdd).toBe(false);
      expect(coursesStore.$state.isContentAdded).toBe(false);
    });

    it("stays open after a failed add", async () => {
      const onClose = vi.fn();
      const onSaved = vi.fn();
      renderWithProviders(ContentModal, { props: { show: true, courseId: 1, onClose, onSaved } });

      coursesStore.setFlag("isContentAdd", true);
      await flush();

      expect(coursesStore.$state.isContentAdd).toBe(false);
      expect(onSaved).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("edit mode", () => {
    it("prefills the form with the content", () => {
      const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1, content } });
      expect(wrapper.text()).toContain("Ubah Konten");
      expect(wrapper.text()).toContain("Simpan Perubahan");
      expect(value(wrapper.find('[data-testid="content-title-input"]'))).toBe("Materi Lama");
      expect(value(wrapper.find('[data-testid="content-youtube-input"]'))).toBe(content.youtube);
    });

    it("submits the changed content", async () => {
      const changeSpy = vi.spyOn(coursesStore, "asyncSetIsContentChange").mockResolvedValue();
      const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1, content } });

      await wrapper.find('[data-testid="content-title-input"]').setValue("Materi Baru");
      await wrapper.find('[data-testid="content-youtube-input"]').setValue(YT);
      await wrapper.find("form").trigger("submit");

      expect(changeSpy).toHaveBeenCalledWith(8, "Materi Baru", YT);
    });

    it("calls onSaved and onClose after a successful change", async () => {
      const onClose = vi.fn();
      const onSaved = vi.fn();
      renderWithProviders(ContentModal, { props: { show: true, courseId: 1, content, onClose, onSaved } });

      coursesStore.setFlag("isContentChanged", true);
      coursesStore.setFlag("isContentChange", true);
      await flush();

      expect(onSaved).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(coursesStore.$state.isContentChange).toBe(false);
      expect(coursesStore.$state.isContentChanged).toBe(false);
    });

    it("stays open after a failed change", async () => {
      const onClose = vi.fn();
      renderWithProviders(ContentModal, { props: { show: true, courseId: 1, content, onClose } });

      coursesStore.setFlag("isContentChange", true);
      await flush();

      expect(coursesStore.$state.isContentChange).toBe(false);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("closes via the buttons and works without callbacks", async () => {
    const onClose = vi.fn();
    const first = renderWithProviders(ContentModal, { props: { show: true, courseId: 1, onClose } });
    click(first.wrapper.find('[data-testid="close-content-modal-btn"]'));
    click(first.wrapper.find('[data-testid="cancel-content-modal-btn"]'));
    expect(onClose).toHaveBeenCalledTimes(2);

    const second = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });
    click(second.wrapper.find('[data-testid="cancel-content-modal-btn"]'));
    coursesStore.setFlag("isContentAdded", true);
    coursesStore.setFlag("isContentAdd", true);
    await flush();
    expect(coursesStore.$state.isContentAdd).toBe(false);
  });
});
