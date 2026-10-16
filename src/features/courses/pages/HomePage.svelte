<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import AddModal from "../modals/AddModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { showConfirmDialog } from "../../../helpers/toolsHelper";
  import { formatRating, getCourseRole } from "../helpers/courseHelper";
  import {
    Plus,
    GraduationCap,
    Eye,
    Pencil,
    Trash2,
    Funnel,
    Search,
    LoaderCircle,
    Video,
    Users,
    Star,
  } from "lucide-svelte";
  import type { Course } from "../api/courseApi";

  let loadingCourses: boolean = false;
  let filter: string = "";
  let searchQuery: string = "";
  let showAddModal: boolean = false;
  let showChangeModal: boolean = false;
  let selectedCourseId: string | number | null = null;

  $: profile = $usersStore.profile;
  $: courses = $coursesStore.courses;

  onMount(() => {
    loadCourses();
  });

  function loadCourses() {
    loadingCourses = true;
    Promise.resolve(coursesStore.asyncSetCourses(filter)).finally(() => {
      loadingCourses = false;
    });
  }

  let prevFilter = filter;
  $: if (filter !== prevFilter) {
    prevFilter = filter;
    loadCourses();
  }

  $: if ($coursesStore.isCourseDelete) {
    coursesStore.setFlag("isCourseDelete", false);
    if ($coursesStore.isCourseDeleted) {
      coursesStore.setFlag("isCourseDeleted", false);
      loadCourses();
    }
  }

  function handleEditCourse(courseId: string | number) {
    selectedCourseId = courseId;
    showChangeModal = true;
  }

  async function handleDeleteCourse(courseId: string | number) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDelete(courseId);
    }
  }

  async function handleDeleteAll() {
    const result = await showConfirmDialog(
      "Semua kursus milik Anda akan dihapus permanen beserta materi dan pesertanya. Lanjutkan?"
    );
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDeleteAll();
    }
  }

  $: filteredCourses = courses.filter((course: Course) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = course.title ? course.title.toLowerCase() : "";
    const description = course.description ? course.description.toLowerCase() : "";
    const author = course.author?.name ? course.author.name.toLowerCase() : "";
    return title.includes(q) || description.includes(q) || author.includes(q);
  });

  $: hasOwnedCourse = courses.some((course: Course) => getCourseRole(course, profile) === "owner");
</script>

{#if profile}
  <div class="space-y-8 animate-in fade-in duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Daftar Kursus
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Temukan kursus, ikuti materinya, dan pantau progres belajar Anda.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        {#if hasOwnedCourse}
          <button
            type="button"
            data-testid="delete-all-courses-btn"
            on:click={handleDeleteAll}
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all"
          >
            <Trash2 size={18} />
            <span>Hapus Semua</span>
          </button>
        {/if}
        <button
          type="button"
          data-testid="add-course-btn"
          on:click={() => (showAddModal = true)}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tambah Kursus</span>
        </button>
      </div>
    </div>

    <!-- Pencarian & filter -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          data-testid="search-course-input"
          bind:value={searchQuery}
          placeholder="Cari judul, deskripsi, atau pengajar..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        />
      </div>

      <div class="flex items-center gap-2.5">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Funnel size={16} /> Filter:
        </span>
        <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            data-testid="filter-all-btn"
            on:click={() => (filter = "")}
            class="px-3 py-1.5 rounded-lg transition-all {filter === '' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}"
          >
            Semua
          </button>
          <button
            type="button"
            data-testid="filter-mine-btn"
            on:click={() => (filter = "1")}
            class="px-3 py-1.5 rounded-lg transition-all {filter === '1' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
          >
            Milik Saya
          </button>
        </div>
      </div>
    </div>

    <!-- Daftar kursus -->
    {#if loadingCourses && filteredCourses.length === 0}
      <div class="bg-white rounded-2xl border border-slate-200/80 px-6 py-16 text-center text-slate-500">
        <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
        <p class="font-medium text-slate-600">Memuat daftar kursus...</p>
      </div>
    {:else if filteredCourses.length === 0}
      <div class="bg-white rounded-2xl border border-slate-200/80 px-6 py-16 text-center text-slate-500">
        <GraduationCap size={40} class="mx-auto text-slate-300 mb-2" />
        <p class="font-medium">Belum ada kursus yang cocok.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {#each filteredCourses as course (course.id)}
          {@const role = getCourseRole(course, profile)}
          <div
            data-testid={`course-card-${course.id}`}
            class="group bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            <div class="relative h-40 bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white/80">
              {#if course.cover}
                <img src={course.cover} alt={course.title} class="w-full h-full object-cover" />
              {:else}
                <GraduationCap size={48} strokeWidth={1.5} />
              {/if}
              {#if role === "owner"}
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-indigo-700">
                  Milik Saya
                </span>
              {:else if role === "student"}
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-emerald-700">
                  Terdaftar
                </span>
              {/if}
            </div>

            <div class="p-5 flex-1 flex flex-col gap-3">
              <div>
                <h2 class="font-bold text-slate-900 leading-snug line-clamp-2">{course.title}</h2>
                {#if course.description}
                  <p class="text-xs text-slate-500 line-clamp-2 mt-1">{course.description}</p>
                {/if}
              </div>

              <p class="text-xs text-slate-500">
                Oleh <span class="font-semibold text-slate-600">{course.author?.name || "-"}</span>
              </p>

              <div class="flex items-center gap-4 text-xs text-slate-500 mt-auto">
                <span class="inline-flex items-center gap-1.5">
                  <Video size={14} /> {course.total_contents || 0} materi
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <Users size={14} /> {(course.students || []).length} peserta
                </span>
                <span class="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                  <Star size={14} /> {formatRating(course.avg_ratings)}
                </span>
              </div>

              <div class="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  data-testid={`view-course-${course.id}`}
                  on:click={() => goto(`/courses/${course.id}`)}
                  class="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Lihat Detail"
                >
                  <Eye size={18} />
                </button>
                {#if role === "owner"}
                  <button
                    type="button"
                    data-testid={`edit-course-${course.id}`}
                    on:click={() => handleEditCourse(course.id)}
                    class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Ubah Kursus"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-course-${course.id}`}
                    on:click={() => handleDeleteCourse(course.id)}
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Kursus"
                  >
                    <Trash2 size={18} />
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <AddModal
      show={showAddModal}
      onClose={() => (showAddModal = false)}
      onSaved={loadCourses}
    />
    <ChangeModal
      show={showChangeModal}
      courseId={selectedCourseId}
      onClose={() => (showChangeModal = false)}
      onSaved={loadCourses}
    />
  </div>
{/if}
