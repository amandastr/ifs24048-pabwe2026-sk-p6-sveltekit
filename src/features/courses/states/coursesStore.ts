import { writable } from "svelte/store";
import courseApi, { type Course, type CourseContent } from "../api/courseApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface CoursesState {
  courses: Course[];
  course: Course | null;
  content: CourseContent | null;
  // detail dimuat
  isCourse: boolean;
  isContent: boolean;
  // kursus
  isCourseAdd: boolean;
  isCourseAdded: boolean;
  isCourseChange: boolean;
  isCourseChanged: boolean;
  isCourseDelete: boolean;
  isCourseDeleted: boolean;
  // sampul
  isCourseChangeCover: boolean;
  isCourseChangedCover: boolean;
  // peserta
  isCourseStudentChange: boolean;
  isCourseStudentChanged: boolean;
  // rating
  isCourseRatingChange: boolean;
  isCourseRatingChanged: boolean;
  // konten
  isContentAdd: boolean;
  isContentAdded: boolean;
  isContentChange: boolean;
  isContentChanged: boolean;
  isContentDelete: boolean;
  isContentDeleted: boolean;
  isContentStatusChange: boolean;
  isContentStatusChanged: boolean;
}

export type CoursesFlag = {
  [K in keyof CoursesState]: CoursesState[K] extends boolean ? K : never;
}[keyof CoursesState];

type MutationFlags = { done: CoursesFlag; ok: CoursesFlag };

function createCoursesStore() {
  const initial: CoursesState = {
    courses: [],
    course: null,
    content: null,
    isCourse: false,
    isContent: false,
    isCourseAdd: false,
    isCourseAdded: false,
    isCourseChange: false,
    isCourseChanged: false,
    isCourseDelete: false,
    isCourseDeleted: false,
    isCourseChangeCover: false,
    isCourseChangedCover: false,
    isCourseStudentChange: false,
    isCourseStudentChanged: false,
    isCourseRatingChange: false,
    isCourseRatingChanged: false,
    isContentAdd: false,
    isContentAdded: false,
    isContentChange: false,
    isContentChanged: false,
    isContentDelete: false,
    isContentDeleted: false,
    isContentStatusChange: false,
    isContentStatusChanged: false,
  };

  let currentState: CoursesState = { ...initial };
  const innerStore = writable<CoursesState>(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  function patch(partial: Partial<CoursesState>) {
    innerStore.update((s) => ({ ...s, ...partial }));
  }

  // Pola umum mutasi: jalankan aksi, tampilkan dialog, lalu naikkan bendera.
  // flags.ok menandai berhasil/gagal, flags.done menandai proses selesai.
  async function mutate(
    action: () => Promise<string | undefined | void>,
    successFallback: string,
    flags: MutationFlags
  ) {
    try {
      const message = await action();
      showSuccessDialog(message || successFallback);
      patch({ [flags.ok]: true });
    } catch (error: any) {
      showErrorDialog(error.message);
      patch({ [flags.ok]: false });
    } finally {
      patch({ [flags.done]: true });
    }
  }

  return {
    subscribe: innerStore.subscribe,
    get courses() {
      return currentState.courses;
    },
    get course() {
      return currentState.course;
    },
    get content() {
      return currentState.content;
    },
    get $state() {
      return currentState;
    },
    reset(state: Partial<CoursesState> = initial) {
      innerStore.set({ ...initial, ...state });
    },
    setCourses(courses: Course[]) {
      patch({ courses });
    },
    setCourse(course: Course | null) {
      patch({ course });
    },
    setContent(content: CourseContent | null) {
      patch({ content });
    },
    setFlag(flag: CoursesFlag, status: boolean) {
      patch({ [flag]: status });
    },

    // ===== Pengambilan data =====
    async asyncSetCourses(isMe: string | number | boolean = "") {
      try {
        this.setCourses(await courseApi.getCourses(isMe));
      } catch {
        this.setCourses([]);
      }
    },
    async asyncSetCourse(courseId: string | number) {
      try {
        this.setCourse(await courseApi.getCourseById(courseId));
      } catch {
        this.setCourse(null);
      } finally {
        this.setFlag("isCourse", true);
      }
    },
    async asyncSetContent(contentId: string | number) {
      try {
        this.setContent(await courseApi.getContentById(contentId));
      } catch {
        this.setContent(null);
      } finally {
        this.setFlag("isContent", true);
      }
    },

    // ===== Kursus =====
    asyncSetIsCourseAdd(title: string, description: string) {
      return mutate(
        async () => {
          await courseApi.postCourse(title, description);
        },
        "Kursus berhasil ditambahkan!",
        { done: "isCourseAdd", ok: "isCourseAdded" }
      );
    },
    asyncSetIsCourseChange(courseId: string | number, title: string, description: string) {
      return mutate(
        () => courseApi.putCourse(courseId, title, description),
        "Kursus berhasil diubah!",
        { done: "isCourseChange", ok: "isCourseChanged" }
      );
    },
    asyncSetIsCourseChangeCover(courseId: string | number, cover: File) {
      return mutate(
        () => courseApi.postCourseCover(courseId, cover),
        "Sampul kursus berhasil diubah!",
        { done: "isCourseChangeCover", ok: "isCourseChangedCover" }
      );
    },
    asyncSetIsCourseDelete(courseId: string | number) {
      return mutate(() => courseApi.deleteCourse(courseId), "Kursus berhasil dihapus!", {
        done: "isCourseDelete",
        ok: "isCourseDeleted",
      });
    },
    asyncSetIsCourseDeleteAll() {
      return mutate(() => courseApi.deleteAllCourses(), "Semua kursus berhasil dihapus!", {
        done: "isCourseDelete",
        ok: "isCourseDeleted",
      });
    },

    // ===== Peserta & rating =====
    asyncSetIsCourseJoin(courseId: string | number) {
      return mutate(() => courseApi.postStudent(courseId), "Berhasil mendaftar pada kursus!", {
        done: "isCourseStudentChange",
        ok: "isCourseStudentChanged",
      });
    },
    asyncSetIsCourseLeave(courseId: string | number) {
      return mutate(() => courseApi.deleteStudent(courseId), "Berhasil keluar dari kursus!", {
        done: "isCourseStudentChange",
        ok: "isCourseStudentChanged",
      });
    },
    asyncSetIsCourseRatingChange(courseId: string | number, ratings: number, comment: string) {
      return mutate(
        () => courseApi.putRatings(courseId, ratings, comment),
        "Rating berhasil disimpan!",
        { done: "isCourseRatingChange", ok: "isCourseRatingChanged" }
      );
    },

    // ===== Konten =====
    asyncSetIsContentAdd(courseId: string | number, title: string, youtube: string) {
      return mutate(
        async () => {
          await courseApi.postContent(courseId, title, youtube);
        },
        "Konten berhasil ditambahkan!",
        { done: "isContentAdd", ok: "isContentAdded" }
      );
    },
    asyncSetIsContentChange(contentId: string | number, title: string, youtube: string) {
      return mutate(
        () => courseApi.putContent(contentId, title, youtube),
        "Konten berhasil diubah!",
        { done: "isContentChange", ok: "isContentChanged" }
      );
    },
    asyncSetIsContentDelete(contentId: string | number) {
      return mutate(() => courseApi.deleteContent(contentId), "Konten berhasil dihapus!", {
        done: "isContentDelete",
        ok: "isContentDeleted",
      });
    },
    asyncSetIsContentStatusChange(contentId: string | number, status: number | boolean) {
      return mutate(
        () => courseApi.postContentStatus(contentId, status),
        "Status belajar berhasil diubah!",
        { done: "isContentStatusChange", ok: "isContentStatusChanged" }
      );
    },
  };
}

export const coursesStore = createCoursesStore();
export const useCoursesStore = () => coursesStore;
export default coursesStore;
