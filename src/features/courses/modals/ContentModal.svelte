<script lang="ts">
  import { Video, X, LoaderCircle, Save } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";
  import { getYoutubeEmbedUrl } from "../helpers/courseHelper";
  import type { CourseContent } from "../api/courseApi";

  export let show: boolean = false;
  export let courseId: string | number | null = null;
  // null = tambah konten baru, terisi = ubah konten
  export let content: CourseContent | null = null;
  export let onClose: (() => void) | undefined = undefined;
  export let onSaved: (() => void) | undefined = undefined;

  let loading: boolean = false;
  let title: string = "";
  let youtube: string = "";

  $: isEdit = !!content;

  function handleClose() {
    if (onClose) onClose();
  }

  $: document.body.style.overflow = show ? "hidden" : "auto";

  // Isi ulang formulir setiap modal dibuka atau konten berganti
  $: if (show) {
    title = content ? content.title : "";
    youtube = content ? content.youtube : "";
  }

  function handleDone(isDone: boolean, isOk: boolean) {
    if (!isDone) return;
    loading = false;
    if (isEdit) {
      coursesStore.setFlag("isContentChange", false);
    } else {
      coursesStore.setFlag("isContentAdd", false);
    }
    if (isOk) {
      if (isEdit) {
        coursesStore.setFlag("isContentChanged", false);
      } else {
        coursesStore.setFlag("isContentAdded", false);
      }
      if (onSaved) onSaved();
      handleClose();
    }
  }

  $: handleDone(
    isEdit ? $coursesStore.isContentChange : $coursesStore.isContentAdd,
    isEdit ? $coursesStore.isContentChanged : $coursesStore.isContentAdded
  );

  function handleSave() {
    if (!title.trim()) {
      showErrorDialog("Judul tidak boleh kosong");
      return;
    }

    if (!getYoutubeEmbedUrl(youtube)) {
      showErrorDialog("Tautan YouTube tidak valid");
      return;
    }

    loading = true;
    if (isEdit) {
      coursesStore.asyncSetIsContentChange(content.id, title.trim(), youtube.trim());
    } else {
      coursesStore.asyncSetIsContentAdd(courseId, title.trim(), youtube.trim());
    }
  }
</script>

{#if show}
  <div
    data-testid="content-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <Video size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800">
              {isEdit ? "Ubah Konten" : "Tambah Konten"}
            </h3>
            <p class="text-xs text-slate-600">Materi berupa tautan video YouTube</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="close-content-modal-btn"
          on:click={handleClose}
          class="p-2 rounded-xl text-slate-600 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSave} class="p-6 space-y-4">
        <div>
          <label for="content-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Materi <span class="text-red-500">*</span>
          </label>
          <input
            id="content-title-input"
            type="text"
            data-testid="content-title-input"
            bind:value={title}
            placeholder="Contoh: Pengenalan Variabel"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
          />
        </div>

        <div>
          <label for="content-youtube-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Tautan YouTube <span class="text-red-500">*</span>
          </label>
          <input
            id="content-youtube-input"
            type="url"
            data-testid="content-youtube-input"
            bind:value={youtube}
            placeholder="https://youtu.be/uHyfQV0kbgo"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-content-modal-btn"
            on:click={handleClose}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-content-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <Save size={18} strokeWidth={2.5} />
              <span>{isEdit ? "Simpan Perubahan" : "Tambah Konten"}</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
