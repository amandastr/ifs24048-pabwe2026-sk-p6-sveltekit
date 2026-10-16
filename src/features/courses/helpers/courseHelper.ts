export type CourseRole = "owner" | "student" | "guest";

interface RoleCourse {
  user_id?: number | string | null;
  students?: Array<number | string> | null;
}

interface RoleProfile {
  id?: number | string | null;
}

/**
 * Menentukan peran pengguna pada sebuah kursus.
 * Pemilik (user_id sama dengan id profil) selalu diprioritaskan
 * di atas peserta (id profil ada di daftar students).
 */
export function getCourseRole(
  course: RoleCourse | null | undefined,
  profile: RoleProfile | null | undefined
): CourseRole {
  if (!course || !profile || profile.id === undefined || profile.id === null) {
    return "guest";
  }

  const profileId = String(profile.id);
  if (String(course.user_id) === profileId) return "owner";

  const students = course.students || [];
  if (students.some((studentId) => String(studentId) === profileId)) {
    return "student";
  }

  return "guest";
}

/**
 * Mengambil ID video dari tautan YouTube
 * (youtu.be, youtube.com/watch, /embed, /shorts, /live).
 */
export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = parsed.pathname.split("/")[1] || null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else {
      const [, type, videoId] = parsed.pathname.split("/");
      if (["embed", "shorts", "live"].includes(type)) id = videoId || null;
    }
  }

  return id && /^[\w-]{6,}$/.test(id) ? id : null;
}

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** Format rata-rata rating menjadi satu desimal, atau "-" bila belum ada. */
export function formatRating(value: string | number | null | undefined): string {
  const num = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(num)) return "-";
  return num.toFixed(1);
}
