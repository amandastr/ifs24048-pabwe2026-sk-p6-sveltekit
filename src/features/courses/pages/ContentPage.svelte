<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { getCourseRole, getYoutubeEmbedUrl } from "../helpers/courseHelper";
  import { ArrowLeft, CircleCheck, Circle, Video, ExternalLink } from "lucide-svelte";

  export let courseId: string | number;
  export let contentId: string | number;

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;
  $: content = $coursesStore.content;
  $: role = getCourseRole(course, profile);
  $: embedUrl = getYoutubeEmbedUrl(content?.youtube);
  $: isFinished = !!content?.my_status_finished;

  function loadContent() {
    coursesStore.setContent(null);
    coursesStore.setFlag("isContent", false);
    coursesStore.asyncSetContent(contentId);
  }

  onMount(() => {
    // Kursus dimuat untuk menentukan peran (pemilik, peserta, atau tamu)
    coursesStore.setCourse(null);
    coursesStore.setFlag("isCourse", false);
    coursesStore.asyncSetCourse(courseId);
    loadContent();
  });

  let prevContentId = contentId;
  $: if (contentId !== prevContentId) {
    prevContentId = contentId;
    loadContent();
  }

  $: if ($coursesStore.isCourse) {
    coursesStore.setFlag("isCourse", false);
  }

  $: if ($coursesStore.isContent) {
    coursesStore.setFlag("isContent", false);
    if (!content) {
      goto(`/courses/${courseId}`);
    }
  }

  $: if ($coursesStore.isContentStatusChange) {
    coursesStore.setFlag("isContentStatusChange", false);
    if ($coursesStore.isContentStatusChanged) {
      coursesStore.setFlag("isContentStatusChanged", false);
      coursesStore.asyncSetContent(contentId);
    }
  }

  function handleToggleStatus() {
    coursesStore.asyncSetIsContentStatusChange(content.id, isFinished ? 0 : 1);
  }
</script>

{#if !profile || !content}
  <div class="flex flex-col items-center justify-center py-20">
    <h1 class="sr-only">Memuat halaman...</h1>
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <a
      href={`/courses/${courseId}`}
      data-testid="back-to-course-link"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <ArrowLeft size={18} />
      Kembali ke Kursus
    </a>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <!-- Pemutar -->
      <div class="relative w-full aspect-video bg-slate-900">
        {#if embedUrl}
          <iframe
            data-testid="youtube-player"
            src={embedUrl}
            title={content.title}
            class="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else}
          <div data-testid="player-fallback" class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300 p-6 text-center">
            <Video size={40} />
            <p class="text-sm">Tautan video tidak dapat diputar di sini.</p>
            <a
              href={content.youtube}
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
            >
              <ExternalLink size={14} /> Buka tautan
            </a>
          </div>
        {/if}
      </div>

      <div class="p-6 sm:p-8 space-y-5">
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {course?.title || "Materi Kursus"}
          </p>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{content.title}</h1>
        </div>

        {#if role === "student"}
          <div class="flex flex-wrap items-center gap-3">
            <span
              data-testid="status-badge"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border {isFinished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}"
            >
              {#if isFinished}
                <CircleCheck size={14} /> Selesai
              {:else}
                <Circle size={14} /> Belum selesai
              {/if}
            </span>
            <button
              type="button"
              data-testid="toggle-status-btn"
              on:click={handleToggleStatus}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors {isFinished ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-700 hover:bg-emerald-800'}"
            >
              {isFinished ? "Tandai Belum Selesai" : "Tandai Selesai"}
            </button>
          </div>
        {:else if role === "owner"}
          <p data-testid="owner-note" class="text-sm text-slate-500">
            Anda adalah pemilik kursus ini. Status belajar hanya dapat diubah oleh peserta.
          </p>
        {:else}
          <p data-testid="guest-note" class="text-sm text-slate-500">
            Daftar pada kursus ini untuk menandai materi sebagai selesai.
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}
