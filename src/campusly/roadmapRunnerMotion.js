export const RUNNER_CYCLE_SECONDS = 0.56;
export const RUNNER_SCROLL_IDLE_MS = 140;

export function shouldRunnerMove(progress, lastScrollAt, now, direction = 1) {
  return (direction > 0 ? progress < 1 : progress > 0) && now - lastScrollAt < RUNNER_SCROLL_IDLE_MS;
}

export function getScrollDirection(previousY, nextY, previousDirection = 1) {
  return nextY === previousY ? previousDirection : nextY > previousY ? 1 : -1;
}

export function getTravelHeading(x, y, direction) {
  return Math.atan2(y * direction, x * direction);
}

export function getRunningPose(time) {
  const phase = (time / RUNNER_CYCLE_SECONDS) * Math.PI * 2;
  const stride = Math.sin(phase);

  return {
    bob: 0.035 + Math.abs(Math.sin(phase * 2)) * 0.06,
    bodyRoll: stride * 0.025,
    torsoPitch: -0.1 + Math.sin(phase * 2) * 0.025,
    headPitch: -0.02 + Math.sin(phase * 2 + 0.4) * 0.025,
    packRoll: Math.sin(phase + 0.4) * 0.035,
    packLift: Math.sin(phase * 2) * 0.02,
    leftHip: stride * 0.62,
    rightHip: -stride * 0.62,
    leftKnee: Math.max(0, Math.sin(phase + 1.3)) * 0.75,
    rightKnee: Math.max(0, Math.sin(phase + Math.PI + 1.3)) * 0.75,
    leftShoulder: -stride * 0.48,
    rightShoulder: stride * 0.48,
    leftElbow: -0.32 - Math.max(0, stride) * 0.18,
    rightElbow: -0.32 - Math.max(0, -stride) * 0.18,
  };
}
