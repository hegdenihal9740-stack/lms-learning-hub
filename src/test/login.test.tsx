import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Login } from "@/campusly/App";
import { sendPasswordReset } from "@/campusly/cloudAuth";

vi.mock("@/campusly/NeuralBackground.jsx", () => ({
  default: () => null,
}));

vi.mock("@/campusly/cloudAuth", () => ({
  sendPasswordReset: vi.fn().mockResolvedValue({ error: null }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("student login", () => {
  it("accepts registration numbers, not email addresses, for sign-in", async () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} previewMode={false} />);

    expect(screen.getByLabelText("Registration number")).toHaveAttribute("type", "text");
    fireEvent.change(screen.getByLabelText("Registration number"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Registration-number sign-in is not connected for this account yet",
    );
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("keeps email available for password reset", async () => {
    render(<Login onLogin={vi.fn()} previewMode={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(sendPasswordReset).toHaveBeenCalledWith("student@example.com");
    expect(await screen.findByRole("status")).toHaveTextContent("you’ll receive a reset link");
  });
});
