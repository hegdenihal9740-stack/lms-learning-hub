import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.doUnmock("@/integrations/supabase/client");
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("AuthProvider", () => {
  it("lets local development continue without Supabase configuration", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    localStorage.setItem("campusly-demo-session", "student@skillai.demo");
    sessionStorage.setItem("campusly-login-onboarding-step", "password");
    const { AuthProvider, useCloudAuth } = await import("@/components/auth-provider");

    function AuthStatus() {
      const { ready, configured } = useCloudAuth();
      return createElement("p", null, ready && !configured ? "preview ready" : "loading");
    }

    render(createElement(AuthProvider, null, createElement(AuthStatus)));

    expect(await screen.findByText("preview ready")).toBeInTheDocument();
    expect(localStorage.getItem("campusly-demo-session")).toBeNull();
    expect(sessionStorage.getItem("campusly-login-onboarding-step")).toBeNull();
  });

  it("clears a saved Supabase session when the app is opened", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    const auth = {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    };
    vi.doMock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
    const { AuthProvider, useCloudAuth } = await import("@/components/auth-provider");

    function AuthStatus() {
      const { ready, user } = useCloudAuth();
      return createElement("p", null, ready ? (user ? "signed in" : "login required") : "loading");
    }

    render(createElement(AuthProvider, null, createElement(AuthStatus)));

    expect(await screen.findByText("login required")).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("preserves the recovery session on the password-reset route", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    window.history.replaceState({}, "", "/reset-password");
    const auth = {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    };
    vi.doMock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
    const { AuthProvider, useCloudAuth } = await import("@/components/auth-provider");

    function AuthStatus() {
      const { ready } = useCloudAuth();
      return createElement("p", null, ready ? "reset ready" : "loading");
    }

    render(createElement(AuthProvider, null, createElement(AuthStatus)));

    expect(await screen.findByText("reset ready")).toBeInTheDocument();
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
