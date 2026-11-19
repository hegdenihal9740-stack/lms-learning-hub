import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import BottomNav from "@/campusly/BottomNav";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("opens Study Materials from the bottom navigation", () => {
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  const setPage = vi.fn();

  render(<BottomNav page="dashboard" setPage={setPage} onMore={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Study Materials" }));

  expect(setPage).toHaveBeenCalledWith("materials");
});
