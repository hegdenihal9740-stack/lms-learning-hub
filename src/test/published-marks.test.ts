import { describe, expect, it } from "vitest";

import { getPublishedModuleMarks } from "@/campusly/data";

describe("published module marks", () => {
  it("shows a module only after its mark is published with a score", () => {
    const marks = [
      { id: "module-2", module: 2, status: "Published", score: 78 },
      { id: "module-3", module: 3, status: "Pending", score: null },
      { id: "module-4", module: 4, status: "Not started", score: null },
    ];

    expect(getPublishedModuleMarks(marks).map((mark) => mark.id)).toEqual(["module-2"]);
    expect(
      getPublishedModuleMarks([
        ...marks,
        { id: "module-3", module: 3, status: "Published", score: 82 },
      ])
        .filter((mark) => mark.module === 3)
        .map((mark) => mark.score),
    ).toEqual([82]);
  });
});
