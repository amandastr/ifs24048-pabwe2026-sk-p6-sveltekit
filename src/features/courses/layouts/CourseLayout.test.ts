import { describe, it, expect, vi, beforeEach } from "vitest";
import CourseLayout from "./CourseLayout.svelte";
import { renderWithProviders } from "../../../test-utils";
import apiHelper from "../../../helpers/apiHelper";
import { usersStore } from "../../users/states/usersStore";
import { authStore } from "../../auth/states/authStore";
import { mockGoto } from "../../../setupTests";

const flush = () => new Promise((r) => setTimeout(r, 10));
const click = (el: any) => (el.element as HTMLElement).click();
const profile = { id: 1, name: "Test User", email: "test@delcom.org" };

describe("CourseLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGoto.mockClear();
    vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(undefined as any);
  });

  it("redirects to login and shows a spinner when there is no access token", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue(null);
    const { wrapper } = renderWithProviders(CourseLayout, { preloadedState: { profile: null } });

    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
    expect(usersStore.asyncSetProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Memuat sesi pengguna...");
  });

  it("loads the profile when an access token exists", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    renderWithProviders(CourseLayout, { preloadedState: { profile: null } });
    expect(usersStore.asyncSetProfile).toHaveBeenCalled();
  });

  it("renders the navbar and sidebar and toggles the mobile sidebar", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper } = renderWithProviders(CourseLayout, { preloadedState: { profile } });

    expect(wrapper.text()).toContain("Delcom Courses");
    expect(wrapper.text()).toContain("Test User");
    expect(wrapper.text()).toContain("Semua Kursus");

    click(wrapper.find('[data-testid="toggle-sidebar-btn"]'));
    await flush();
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(true);

    click(wrapper.find('[data-testid="sidebar-backdrop"]'));
    await flush();
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);
  });

  it("logs out from the navbar dropdown", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const logoutSpy = vi.spyOn(authStore, "asyncSetIsAuthLogout").mockResolvedValue(undefined as any);
    const { wrapper } = renderWithProviders(CourseLayout, { preloadedState: { profile } });

    click(wrapper.find('[data-testid="profile-dropdown-button"]'));
    await flush();
    click(wrapper.find('[data-testid="dropdown-logout-button"]'));
    await flush();

    expect(logoutSpy).toHaveBeenCalled();
  });

  it("stays on the page when the profile check finishes with a profile", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper } = renderWithProviders(CourseLayout, { preloadedState: { profile } });

    usersStore.setIsProfile(true);
    await flush();

    expect(usersStore.$state.isProfile).toBe(false);
    expect(wrapper.text()).toContain("Test User");
    expect(mockGoto).not.toHaveBeenCalledWith("/auth/login");
  });

  it("clears the token and redirects when the profile check finishes without a profile", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});
    renderWithProviders(CourseLayout, { preloadedState: { profile: null } });

    usersStore.setIsProfile(true);
    await flush();

    expect(putTokenSpy).toHaveBeenCalledWith("");
    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects to login after logout", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    renderWithProviders(CourseLayout, { preloadedState: { profile } });

    authStore.setIsAuthLogout(true);
    await flush();

    expect(authStore.$state.isAuthLogout).toBe(false);
    expect(usersStore.$state.profile).toBeNull();
    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
  });
});
