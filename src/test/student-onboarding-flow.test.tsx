import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { webcrypto } from "node:crypto";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StudentOnboarding from "../campusly/StudentOnboarding.jsx";
import { DEMO_USER, setCurrentUser } from "@/campusly/data";
import { DEMO_PASSWORD_KEY, verifyStudentPassword } from "@/campusly/studentOnboarding";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

function OnboardingHarness() {
  const [step, setStep] = useState("password");
  const [complete, setComplete] = useState(false);
  if (complete) return <p>Dashboard ready</p>;
  return (
    <StudentOnboarding
      step={step}
      onPasswordChanged={() => setStep("profile")}
      onProfileCompleted={() => setComplete(true)}
    />
  );
}

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

describe("required post-login onboarding", () => {
  it("blocks password changes on an insecure origin", async () => {
    vi.stubGlobal("isSecureContext", false);
    render(
      <StudentOnboarding
        step="password"
        onPasswordChanged={() => undefined}
        onProfileCompleted={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "SecurePass2!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "SecurePass2!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password changes require a secure HTTPS connection",
    );
    expect(localStorage.getItem(DEMO_PASSWORD_KEY)).toBeNull();
  });

  it("keeps student details read-only except for the profile photo", async () => {
    const { container } = render(<OnboardingHarness />);

    expect(screen.getByRole("heading", { name: "Change your password to continue" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "SecurePass2!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "SecurePass2!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByRole("heading", { name: "Review your student information" }),
    ).toBeVisible();
    expect(
      [...container.querySelectorAll<HTMLInputElement>('input:not([type="file"])')].every(
        (input) => input.readOnly,
      ),
    ).toBe(true);
    expect(
      [...container.querySelectorAll<HTMLSelectElement>("select")].every(
        (select) => select.disabled,
      ),
    ).toBe(true);
    expect(
      [...container.querySelectorAll<HTMLTextAreaElement>("textarea")].every(
        (textarea) => textarea.readOnly,
      ),
    ).toBe(true);
    expect(container.querySelector('input[type="file"]')).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Add qualification" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue to dashboard" }));

    expect(await screen.findByText("Dashboard ready")).toBeVisible();
    expect(
      await verifyStudentPassword("SecurePass2!", localStorage.getItem(DEMO_PASSWORD_KEY)!),
    ).toBe(true);
    expect(JSON.parse(localStorage.getItem("campusly-demo-profile") || "{}").name).toBe(
      DEMO_USER.name,
    );
  });
});
