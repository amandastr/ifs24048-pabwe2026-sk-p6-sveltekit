import apiHelper from "../../../helpers/apiHelper";

declare const DELCOM_BASEURL: string;

export interface CourseAuthor {
  name: string;
  photo?: string | null;
}

export interface CourseRating {
  name: string;
  ratings: number;
  comment?: string | null;
}

export interface CourseContent {
  id: number | string;
  course_id: number | string;
  title: string;
  youtube: string;
  created_at?: string;
  updated_at?: string;
  my_status_finished?: boolean | number;
}

export interface Course {
  id: number | string;
  user_id: number | string;
  title: string;
  description: string;
  cover?: string | null;
  created_at?: string;
  updated_at?: string;
  author?: CourseAuthor;
  students?: Array<number | string>;
  total_contents?: number;
  avg_ratings?: string | number | null;
  contents?: CourseContent[];
  ratings?: CourseRating[];
  my_percentage_finished?: string | number | null;
}

const courseApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/courses`;

  function _url(path: string): string {
    return BASE_URL + path;
  }

  const JSON_HEADERS = { "Content-Type": "application/json" };

  // Respons dianggap berhasil bila status bernilai "success".
  async function request(
    path: string,
    options: RequestInit,
    fallbackMessage: string
  ): Promise<any> {
    const response = await apiHelper.fetchData(_url(path), options);
    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  // ===== Kursus =====
  async function postCourse(title: string, description: string): Promise<any> {
    const result = await request(
      "/",
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ title, description }) },
      "Gagal menambahkan kursus"
    );
    return result.data;
  }

  async function postCourseCover(courseId: string | number, cover: File): Promise<string> {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const result = await request(
      `/${courseId}/cover`,
      { method: "POST", body: formData },
      "Gagal mengubah sampul kursus"
    );
    return result.message;
  }

  async function putCourse(
    courseId: string | number,
    title: string,
    description: string
  ): Promise<string> {
    const result = await request(
      `/${courseId}`,
      { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ title, description }) },
      "Gagal mengubah kursus"
    );
    return result.message;
  }

  // isMe = "1" -> hanya kursus milik pengguna (?is_me=1)
  async function getCourses(isMe: string | number | boolean = ""): Promise<Course[]> {
    const path = isMe === "" || isMe === false ? "/" : "/?is_me=1";
    const result = await request(path, { method: "GET" }, "Gagal mengambil data kursus");
    return result.data?.courses || [];
  }

  async function getCourseById(courseId: string | number): Promise<Course> {
    const result = await request(
      `/${courseId}`,
      { method: "GET" },
      "Gagal mengambil detail kursus"
    );
    return result.data?.course;
  }

  async function deleteCourse(courseId: string | number): Promise<string> {
    const result = await request(
      `/${courseId}`,
      { method: "DELETE" },
      "Gagal menghapus kursus"
    );
    return result.message;
  }

  async function deleteAllCourses(): Promise<string> {
    const result = await request("/", { method: "DELETE" }, "Gagal menghapus semua kursus");
    return result.message;
  }

  // ===== Peserta =====
  async function postStudent(courseId: string | number): Promise<string> {
    const result = await request(
      `/${courseId}/students`,
      { method: "POST" },
      "Gagal mendaftar pada kursus"
    );
    return result.message;
  }

  async function deleteStudent(courseId: string | number): Promise<string> {
    const result = await request(
      `/${courseId}/students`,
      { method: "DELETE" },
      "Gagal keluar dari kursus"
    );
    return result.message;
  }

  // ratings: 1 sampai 5
  async function putRatings(
    courseId: string | number,
    ratings: number,
    comment: string
  ): Promise<string> {
    const result = await request(
      `/${courseId}/students/ratings`,
      {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ ratings: Number(ratings), comment }),
      },
      "Gagal mengubah rating kursus"
    );
    return result.message;
  }

  // ===== Konten =====
  async function postContent(
    courseId: string | number,
    title: string,
    youtube: string
  ): Promise<any> {
    const result = await request(
      `/${courseId}/contents`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ title, youtube }) },
      "Gagal menambahkan konten"
    );
    return result.data;
  }

  async function putContent(
    contentId: string | number,
    title: string,
    youtube: string
  ): Promise<string> {
    const result = await request(
      `/-/contents/${contentId}`,
      { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ title, youtube }) },
      "Gagal mengubah konten"
    );
    return result.message;
  }

  async function getContentById(contentId: string | number): Promise<CourseContent> {
    const result = await request(
      `/-/contents/${contentId}`,
      { method: "GET" },
      "Gagal mengambil detail konten"
    );
    return result.data?.course_content;
  }

  async function deleteContent(contentId: string | number): Promise<string> {
    const result = await request(
      `/-/contents/${contentId}`,
      { method: "DELETE", headers: JSON_HEADERS },
      "Gagal menghapus konten"
    );
    return result.message;
  }

  // status belajar: 0 (belum) atau 1 (selesai)
  async function postContentStatus(
    contentId: string | number,
    status: number | boolean
  ): Promise<string> {
    const result = await request(
      `/-/contents/${contentId}/learns`,
      {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ status: status ? 1 : 0 }),
      },
      "Gagal mengubah status belajar"
    );
    return result.message;
  }

  return {
    postCourse,
    postCourseCover,
    putCourse,
    getCourses,
    getCourseById,
    deleteCourse,
    deleteAllCourses,
    postStudent,
    deleteStudent,
    putRatings,
    postContent,
    putContent,
    getContentById,
    deleteContent,
    postContentStatus,
  };
})();

export default courseApi;
