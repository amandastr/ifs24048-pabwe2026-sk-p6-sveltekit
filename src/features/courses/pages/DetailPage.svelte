<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ContentModal from "../modals/ContentModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import { formatRating, getCourseRole } from "../helpers/courseHelper";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Trash2,
    Pencil,
    Plus,
    Calendar,
    CircleCheck,
    Circle,
    GraduationCap,
    Lock,
    Play,
    Save,
    Star,
    UserMinus,
    UserPlus,
    Users,
    Video,
  } from "lucide-svelte";
  import type { CourseContent } from "../api/courseApi";

  export let courseId: string | number;

  let showCoverModal: boolean = false;
  let showEditModal: boolean = false;
  let showContentModal: boolean = false;
  let editingContent: CourseContent | null = null;
  let ratingValue: string = "5";
  let ratingComment: string = "";

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;
  $: role = getCourseRole(course, profile);
  $: contents = course?.contents || [];
  $: ratings = course?.ratings || [];
  $: progress = Number(course?.my_percentage_finished || 0);
  $: progressStyle = `width: ${progress}%`;

  // Isi formulir rating dengan rating milik pengguna bila sudah pernah memberi
  $: myRating = ratings.find((r) => r.name === profile?.name);
  $: if (myRating) {
    ratingValue = String(myRating.ratings);
    ratingComment = myRating.comment || "";
  }

  function loadCourse() {
    coursesStore.setCourse(null);
    coursesStore.setFlag("isCourse", false);
    coursesStore.asyncSetCourse(courseId);
  }

  function refreshCourse() {
    coursesStore.asyncSetCourse(courseId);
  }

  onMount(() => {
    loadCourse();
  });

  let prevId = courseId;
  $: if (courseId !== prevId) {
    prevId = courseId;
    loadCourse();
  }

  $: if ($coursesStore.isCourse) {
    coursesStore.setFlag("isCourse", false);
    if (!course) {
      goto("/");
    }
  }

  $: if ($coursesStore.isCourseDelete) {
    coursesStore.setFlag("isCourseDelete", false);
    if ($coursesStore.isCourseDeleted) {
      coursesStore.setFlag("isCourseDeleted", false);
      goto("/");
    }
  }

  $: if ($coursesStore.isCourseStudentChange) {
    coursesStore.setFlag("isCourseStudentChange", false);
    if ($coursesStore.isCourseStudentChanged) {
      coursesStore.setFlag("isCourseStudentChanged", false);
      refreshCourse();
    }
  }

  $: if ($coursesStore.isCourseRatingChange) {
    coursesStore.setFlag("isCourseRatingChange", false);
    if ($coursesStore.isCourseRatingChanged) {
      coursesStore.setFlag("isCourseRatingChanged", false);
      refreshCourse();
    }
  }

  $: if ($coursesStore.isContentDelete) {
    coursesStore.setFlag("isContentDelete", false);
    if ($coursesStore.isContentDeleted) {
      coursesStore.setFlag("isContentDeleted", false);
      refreshCourse();
    }
  }

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDelete(course.id);
    }
  }

  function handleJoin() {
    coursesStore.asyncSetIsCourseJoin(course.id);
  }

  async function handleLeave() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin keluar dari kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseLeave(course.id);
    }
  }

  function handleSaveRating() {
    coursesStore.asyncSetIsCourseRatingChange(course.id, Number(ratingValue), ratingComment.trim());
  }

  function handleAddContent() {
    editingContent = null;
    showContentModal = true;
  }

  function handleEditContent(content: CourseContent) {
    editingContent = content;
    showContentModal = true;
  }

  async function handleDeleteContent(content: CourseContent) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus konten ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsContentDelete(content.id);
    }
  }

  function openContent(content: CourseContent) {
    goto(`/courses/${course.id}/contents/${content.id}`);
  }
</script>

{#if !profile || !course}
  <div class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <!-- Kembali & aksi pemilik -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-courses-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Kursus
      </a>

      {#if role === "owner"}
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="edit-cover-btn"
            on:click={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} />
            Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-detail-course-btn"
            on:click={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <PenLine size={16} />
            Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-detail-course-btn"
            on:click={handleDelete}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      {/if}
    </div>

    <!-- Kartu utama -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="relative w-full h-56 sm:h-72 bg-gradient-to-tr from-indigo-600 to-cyan-500 overflow-hidden flex items-center justify-center text-white/80">
        {#if course.cover}
          <img src={course.cover} alt={course.title} class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        {:else}
          <GraduationCap size={64} strokeWidth={1.5} />
        {/if}
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-400">{`#${course.id}`}</span>
            {#if role === "owner"}
              <span data-testid="role-badge" class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pemilik Kursus
              </span>
            {:else if role === "student"}
              <span data-testid="role-badge" class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Peserta
              </span>
            {/if}
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {course.title}
          </h1>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
            <span>Pengajar: <strong class="text-slate-600">{course.author?.name || "-"}</strong></span>
            <span class="inline-flex items-center gap-1.5">
              <Users size={14} />
              <strong class="text-slate-600">{(course.students || []).length}</strong> peserta
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Video size={14} />
              <strong class="text-slate-600">{course.total_contents ?? contents.length}</strong> materi
            </span>
            <span class="inline-flex items-center gap-1.5 text-amber-600">
              <Star size={14} />
              <strong>{formatRating(course.avg_ratings)}</strong>
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <div class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <span>Dibuat: <strong class="text-slate-500">{formatDate(course.created_at)}</strong></span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <span>Diperbarui: <strong class="text-slate-500">{formatDate(course.updated_at)}</strong></span>
            </div>
          </div>
        </div>

        <div
          data-testid="course-detail-description"
          class="text-slate-600 bg-slate-50/60 p-6 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line"
        >
          {#if course.description}
            {course.description}
          {:else}
            <p class="italic text-slate-400">Tidak ada deskripsi untuk kursus ini.</p>
          {/if}
        </div>

        <!-- Aksi sesuai peran -->
        {#if role === "student"}
          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Progres belajar Anda</span>
                <span data-testid="progress-label">{progress.toFixed(0)}%</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full bg-emerald-500 transition-all" style={progressStyle}></div>
              </div>
            </div>
            <button
              type="button"
              data-testid="leave-course-btn"
              on:click={handleLeave}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
            >
              <UserMinus size={16} />
              Keluar dari Kursus
            </button>
          </div>
        {:else if role === "guest"}
          <button
            type="button"
            data-testid="join-course-btn"
            on:click={handleJoin}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all"
          >
            <UserPlus size={16} />
            Daftar Kursus
          </button>
        {/if}
      </div>
    </div>

    <!-- Daftar konten -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Daftar Materi</h2>
        {#if role === "owner"}
          <button
            type="button"
            data-testid="add-content-btn"
            on:click={handleAddContent}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            <Plus size={16} />
            Tambah Konten
          </button>
        {/if}
      </div>

      {#if contents.length === 0}
        <div class="px-6 py-12 text-center text-slate-400">
          <Video size={36} class="mx-auto text-slate-300 mb-2" />
          <p class="font-medium">Belum ada materi pada kursus ini.</p>
        </div>
      {:else}
        <ul class="divide-y divide-slate-100">
          {#each contents as content, index (content.id)}
            <li data-testid={`content-row-${content.id}`} class="flex items-center gap-4 px-6 sm:px-8 py-4">
              <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Video size={18} />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">
                  {`${index + 1}. ${content.title}`}
                </p>
                {#if role === "student"}
                  <p class="text-xs mt-0.5 inline-flex items-center gap-1 {content.my_status_finished ? 'text-emerald-600' : 'text-slate-400'}">
                    {#if content.my_status_finished}
                      <CircleCheck size={13} /> Selesai
                    {:else}
                      <Circle size={13} /> Belum selesai
                    {/if}
                  </p>
                {/if}
              </div>

              <div class="flex items-center gap-1.5">
                {#if role === "guest"}
                  <span data-testid={`locked-content-${content.id}`} class="p-1.5 text-slate-400" title="Daftar kursus untuk membuka materi">
                    <Lock size={18} />
                  </span>
                {:else}
                  <button
                    type="button"
                    data-testid={`open-content-${content.id}`}
                    on:click={() => openContent(content)}
                    class="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Buka Materi"
                  >
                    <Play size={18} />
                  </button>
                {/if}
                {#if role === "owner"}
                  <button
                    type="button"
                    data-testid={`edit-content-${content.id}`}
                    on:click={() => handleEditContent(content)}
                    class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Ubah Konten"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-content-${content.id}`}
                    on:click={() => handleDeleteContent(content)}
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Konten"
                  >
                    <Trash2 size={18} />
                  </button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Rating -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="px-6 sm:px-8 py-5 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Rating & Ulasan</h2>
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        {#if role === "student"}
          <form
            on:submit|preventDefault={handleSaveRating}
            data-testid="rating-form"
            class="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-100"
          >
            <p class="text-sm font-semibold text-slate-700">
              {myRating ? "Ubah rating Anda" : "Beri rating untuk kursus ini"}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                data-testid="rating-select"
                aria-label="Rating"
                bind:value={ratingValue}
                class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="5">5 - Sangat baik</option>
                <option value="4">4 - Baik</option>
                <option value="3">3 - Cukup</option>
                <option value="2">2 - Kurang</option>
                <option value="1">1 - Buruk</option>
              </select>
              <input
                type="text"
                data-testid="rating-comment-input"
                aria-label="Komentar"
                bind:value={ratingComment}
                placeholder="Tulis komentar Anda..."
                class="sm:col-span-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <button
              type="submit"
              data-testid="submit-rating-btn"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Save size={16} />
              Simpan Rating
            </button>
          </form>
        {/if}

        {#if ratings.length === 0}
          <p class="text-sm text-slate-400 text-center">Belum ada rating untuk kursus ini.</p>
        {:else}
          <ul class="space-y-4">
            {#each ratings as rating, index (index)}
              <li data-testid={`rating-row-${index}`} class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {rating.name ? rating.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-800">{rating.name}</p>
                  <div class="flex items-center gap-0.5 mt-0.5">
                    {#each [1, 2, 3, 4, 5] as n}
                      <Star size={14} class={n <= rating.ratings ? "text-amber-400" : "text-slate-300"} />
                    {/each}
                  </div>
                  {#if rating.comment}
                    <p class="text-sm text-slate-600 mt-1">{rating.comment}</p>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <ChangeCoverModal
      show={showCoverModal}
      {course}
      onClose={() => (showCoverModal = false)}
      onSaved={refreshCourse}
    />
    <ChangeModal
      show={showEditModal}
      courseId={course.id}
      onClose={() => (showEditModal = false)}
      onSaved={refreshCourse}
    />
    <ContentModal
      show={showContentModal}
      courseId={course.id}
      content={editingContent}
      onClose={() => (showContentModal = false)}
      onSaved={refreshCourse}
    />
  </div>
{/if}
