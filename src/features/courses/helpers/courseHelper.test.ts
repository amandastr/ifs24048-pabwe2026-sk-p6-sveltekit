import { describe, it, expect } from "vitest";
import {
  formatRating,
  getCourseRole,
  getYoutubeEmbedUrl,
  getYoutubeId,
} from "./courseHelper";

describe("courseHelper", () => {
  describe("getCourseRole", () => {
    it("returns guest when course or profile is missing", () => {
      expect(getCourseRole(null, { id: 1 })).toBe("guest");
      expect(getCourseRole(undefined, { id: 1 })).toBe("guest");
      expect(getCourseRole({ user_id: 1 }, null)).toBe("guest");
      expect(getCourseRole({ user_id: 1 }, {})).toBe("guest");
      expect(getCourseRole({ user_id: 1 }, { id: null })).toBe("guest");
    });

    it("returns owner when user_id equals profile id", () => {
      expect(getCourseRole({ user_id: 1, students: [] }, { id: 1 })).toBe("owner");
      expect(getCourseRole({ user_id: "7" }, { id: 7 })).toBe("owner");
    });

    it("returns student when profile id is listed in students", () => {
      expect(getCourseRole({ user_id: 9, students: [2, 3] }, { id: 3 })).toBe("student");
      expect(getCourseRole({ user_id: 9, students: ["3"] }, { id: 3 })).toBe("student");
    });

    it("prioritizes owner when the user is both owner and student", () => {
      expect(getCourseRole({ user_id: 1, students: [1] }, { id: 1 })).toBe("owner");
    });

    it("returns guest when user is neither owner nor student", () => {
      expect(getCourseRole({ user_id: 9, students: [2] }, { id: 3 })).toBe("guest");
      expect(getCourseRole({ user_id: 9, students: null }, { id: 3 })).toBe("guest");
      expect(getCourseRole({ user_id: 9 }, { id: 3 })).toBe("guest");
    });
  });

  describe("getYoutubeId", () => {
    it("returns null for empty or invalid URLs", () => {
      expect(getYoutubeId(null)).toBeNull();
      expect(getYoutubeId(undefined)).toBeNull();
      expect(getYoutubeId("")).toBeNull();
      expect(getYoutubeId("bukan url")).toBeNull();
    });

    it("parses youtu.be links", () => {
      expect(getYoutubeId("https://youtu.be/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeId("https://youtu.be/")).toBeNull();
    });

    it("parses youtube.com watch links", () => {
      expect(getYoutubeId("https://www.youtube.com/watch?v=uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeId("https://m.youtube.com/watch?v=uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeId("https://youtube.com/watch")).toBeNull();
    });

    it("parses embed, shorts, and live links", () => {
      expect(getYoutubeId("https://www.youtube.com/embed/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeId("https://www.youtube-nocookie.com/embed/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeId("https://www.youtube.com/shorts/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeId("https://www.youtube.com/live/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeId("https://www.youtube.com/embed/")).toBeNull();
    });

    it("rejects other paths, hosts, and malformed ids", () => {
      expect(getYoutubeId("https://www.youtube.com/channel/abc")).toBeNull();
      expect(getYoutubeId("https://example.com/watch?v=uHyfQV0kbgo")).toBeNull();
      expect(getYoutubeId("https://youtu.be/ab")).toBeNull();
    });
  });

  describe("getYoutubeEmbedUrl", () => {
    it("builds an embed URL for valid links", () => {
      expect(getYoutubeEmbedUrl(" https://youtu.be/uHyfQV0kbgo ")).toBe(
        "https://www.youtube.com/embed/uHyfQV0kbgo"
      );
    });

    it("returns null for invalid links", () => {
      expect(getYoutubeEmbedUrl("https://example.com")).toBeNull();
      expect(getYoutubeEmbedUrl(null)).toBeNull();
    });
  });

  describe("formatRating", () => {
    it("formats numeric values with one decimal", () => {
      expect(formatRating("4.0000")).toBe("4.0");
      expect(formatRating(3.456)).toBe("3.5");
      expect(formatRating(0)).toBe("0.0");
    });

    it("returns a dash when there is no rating", () => {
      expect(formatRating(null)).toBe("-");
      expect(formatRating(undefined)).toBe("-");
      expect(formatRating("")).toBe("-");
      expect(formatRating("abc")).toBe("-");
    });
  });
});
