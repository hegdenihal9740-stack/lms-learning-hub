import { describe, expect, it } from "vitest";
import {
  getRunningPose,
  RUNNER_CYCLE_SECONDS,
  shouldRunnerMove,
  getScrollDirection,
  getTravelHeading,
} from "../campusly/roadmapRunnerMotion.js";

describe("roadmap runner motion", () => {
  it("keeps the stride cyclic and swaps the legs in opposition", () => {
    const quarterCycle = getRunningPose(RUNNER_CYCLE_SECONDS / 4);
    const nextCycle = getRunningPose(RUNNER_CYCLE_SECONDS * 1.25);

    expect(quarterCycle.leftHip).toBeCloseTo(-quarterCycle.rightHip);
    expect(nextCycle.leftHip).toBeCloseTo(quarterCycle.leftHip);
    expect(nextCycle.rightHip).toBeCloseTo(quarterCycle.rightHip);
  });

  it("keeps all animated pose values finite", () => {
    expect(Object.values(getRunningPose(2.37)).every(Number.isFinite)).toBe(true);
  });

  it("faces forward scrolling down and reverses scrolling up", () => {
    expect(getScrollDirection(100, 200)).toBe(1);
    expect(getScrollDirection(200, 100)).toBe(-1);
    expect(getScrollDirection(100, 100, -1)).toBe(-1);
    expect(getTravelHeading(0, 1, 1)).toBeCloseTo(Math.PI / 2);
    expect(getTravelHeading(0, 1, -1)).toBeCloseTo(-Math.PI / 2);
  });

  it("can walk back from the checkpoint but stops at the start", () => {
    expect(shouldRunnerMove(1, 1000, 1010, -1)).toBe(true);
    expect(shouldRunnerMove(0, 1000, 1010, -1)).toBe(false);
  });

  it("moves only while the roadmap is actively scrolling before its checkpoint", () => {
    expect(shouldRunnerMove(0.5, 1000, 1100)).toBe(true);
    expect(shouldRunnerMove(0.5, 1000, 1140)).toBe(false);
    expect(shouldRunnerMove(1, 1000, 1010)).toBe(false);
  });
});
