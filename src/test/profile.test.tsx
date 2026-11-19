import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StudentProfile from "@/campusly/Profile";
import { DEMO_USER, setCurrentUser } from "@/campusly/data";
import { DEMO_PASSWORD_KEY, verifyStudentPassword } from "@/campusly/studentOnboarding";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", localStorageMock);
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("isSecureContext", true);
  setCurrentUser({ ...DEMO_USER });
});

afterEach(() => {
  cleanup();
  storage.clear();
  setCurrentUser({ ...DEMO_USER });
  vi.unstubAllGlobals();
});

describe("student profile settings", () => {
  it("allows students to update and save their personal information", async () => {
    render(<StudentProfile updateData={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit information" }));
    fireEvent.change(screen.getByLabelText("Phone Number"), {
      target: { value: "+91 9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save information" }));

    await waitFor(() => {
      const savedProfile = JSON.parse(localStorage.getItem("campusly-demo-profile") || "{}");
      expect(savedProfile.phone).toBe("+91 9876543210");
    });
  });

  it("changes the demo password only after verifying the current password", async () => {
    render(<StudentProfile />);
    fireEvent.click(screen.getByRole("tab", { name: /security/i }));
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "incorrect-password" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Your current password is incorrect.")).toBeInTheDocument();
    expect(localStorage.getItem(DEMO_PASSWORD_KEY)).toBeNull();

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: DEMO_USER.password },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(async () => {
      const savedHash = localStorage.getItem(DEMO_PASSWORD_KEY);
      expect(savedHash).not.toBeNull();
      expect(await verifyStudentPassword("StrongPass1!", savedHash!)).toBe(true);
    });
    expect(await screen.findByText("Your password has been changed.")).toBeInTheDocument();
  });
});
