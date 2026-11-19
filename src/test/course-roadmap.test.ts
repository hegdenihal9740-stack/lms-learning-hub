import { afterEach, describe, expect, it } from "vitest";

import {
  DEMO_USER,
  getClassTestGrandfatheredThrough,
  getCurrentCourse,
  initialData,
  loadDemoData,
  setCurrentUser,
} from "@/campusly/data";
import { MODULE_ROADMAP } from "@/campusly/sessions";

afterEach(() => {
  window.localStorage.removeItem("campusly-demo-data");
});

describe("course learning roadmap", () => {
  it("keeps the certificate application locked until course completion", () => {
    expect(initialData.certificateUnlocked).toBe(false);

    const saved = structuredClone(initialData);
    delete saved.certificateUnlocked;
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    expect(loadDemoData().certificateUnlocked).toBe(false);
  });

  it("removes saved assignments and assignment notifications from demo data", () => {
    setCurrentUser({ ...DEMO_USER });
    const saved = {
      ...structuredClone(initialData),
      assignments: [{ id: 1, title: "Old assignment" }],
      notifications: [
        ...initialData.notifications,
        {
          id: 5,
          title: "Assignment reminder",
          message: "An old assignment is due.",
          time: "Yesterday",
          read: false,
          kind: "assignment",
        },
      ],
    };
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    const loaded = loadDemoData();

    expect(loaded).not.toHaveProperty("assignments");
    expect(loaded.notifications.some((notification) => notification.kind === "assignment")).toBe(
      false,
    );
  });

  it("provides an overview, skills, and career pathways for all ten modules", () => {
    expect(initialData.courses).toHaveLength(10);

    for (const course of initialData.courses) {
      const roadmap = MODULE_ROADMAP[course.id];

      expect(roadmap.overview).toBeTruthy();
      expect(roadmap.skills.length).toBeGreaterThan(0);
      expect(roadmap.roles.length).toBeGreaterThan(0);
      expect(course.sessions).toHaveLength(course.lessons);
    }
  });

  it("includes one absent session in the current module's demo attendance", () => {
    const currentModule = initialData.courses.find((course) => course.completed < course.lessons);
    const records = initialData.attendance.filter((record) =>
      currentModule.title.endsWith(record.course),
    );

    expect(records.filter((record) => record.status === "Absent")).toHaveLength(1);
    expect(records.find((record) => record.status === "Absent").session).toBe(4);
  });

  it("applies the Module 3 absence to previously saved demo attendance", () => {
    const saved = structuredClone(initialData);
    const missedSession = saved.attendance.find(
      (record) => record.course === "ML, Data Science & Data Visualization" && record.session === 4,
    );
    missedSession.status = "Present";
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    const loaded = loadDemoData();
    const moduleThreeAbsences = loaded.attendance.filter(
      (record) =>
        record.course === "ML, Data Science & Data Visualization" && record.status === "Absent",
    );

    expect(moduleThreeAbsences).toHaveLength(1);
    expect(moduleThreeAbsences[0].session).toBe(4);
  });

  it("updates saved module titles without discarding student progress", () => {
    const saved = structuredClone(initialData);
    saved.courses[8].title = "Module 9: Introduction to Generative AI & Agentic AI";
    saved.courses[8].completed = 4;
    saved.courses[8].progress = 27;
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    const loaded = loadDemoData();

    expect(loaded.courses[8].title).toBe(initialData.courses[8].title);
    expect(loaded.courses[8].completed).toBe(4);
    expect(loaded.courses[8].progress).toBe(27);
  });

  it("adds demo scores for completed Modules 1 and 2 without replacing saved attempts", () => {
    const saved = structuredClone(initialData);
    saved.classTests = {
      "1-15": { score: 2, total: 10, status: "Failed", date: "25 Oct 2026" },
    };
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    const loaded = loadDemoData();
    const historicalSessions = loaded.courses
      .filter((course) => course.id <= 2)
      .flatMap((course) => course.sessions.filter((session) => session.done).map((session) => ({
        course,
        session,
      })));

    expect(historicalSessions).toHaveLength(55);
    expect(
      historicalSessions.every(({ course, session }) =>
        Number.isFinite(loaded.classTests[`${course.id}-${session.num}`]?.score),
      ),
    ).toBe(true);
    expect(loaded.classTests["1-15"]).toEqual(saved.classTests["1-15"]);
  });

  it("shows demo scores through Module 3 Session 7 and leaves Session 8 as the next test", () => {
    const saved = structuredClone(initialData);
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    const loaded = loadDemoData();

    for (let session = 1; session <= 7; session += 1) {
      expect(loaded.classTests[`3-${session}`]?.score).toBeTypeOf("number");
    }
    expect(loaded.classTests["3-8"]).toBeUndefined();
  });

  it("seeds passing assessments for previous demo modules before unlocking Module 3", () => {
    const saved = structuredClone(initialData);
    saved.moduleAssessments = {
      2: { score: 0, total: 200, status: "Failed", attempts: 1 },
    };
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    const loaded = loadDemoData();
    const grandfatheredThroughModule = getClassTestGrandfatheredThrough(loaded);

    expect(grandfatheredThroughModule).toBe(0);
    expect(loaded.moduleAssessments[1]).toMatchObject({
      score: 68,
      total: 75,
      status: "Passed",
    });
    expect(loaded.moduleAssessments[2]).toMatchObject({
      score: 180,
      total: 200,
      status: "Passed",
    });
    expect(
      getCurrentCourse(
        loaded.courses,
        loaded.classTests,
        grandfatheredThroughModule,
        {},
      )?.id,
    ).toBe(1);
    expect(
      getCurrentCourse(
        loaded.courses,
        loaded.classTests,
        grandfatheredThroughModule,
        loaded.moduleAssessments,
      )?.id,
    ).toBe(3);

    const moduleOneAssessmentMissing = { ...loaded.moduleAssessments };
    delete moduleOneAssessmentMissing[1];
    expect(
      getCurrentCourse(
        loaded.courses,
        loaded.classTests,
        grandfatheredThroughModule,
        moduleOneAssessmentMissing,
      )?.id,
    ).toBe(1);
  });

  it("preserves an existing passing Module 2 assessment score", () => {
    const saved = structuredClone(initialData);
    saved.moduleAssessments = {
      2: { score: 190, total: 200, status: "Passed", attempts: 1 },
    };
    window.localStorage.setItem("campusly-demo-data", JSON.stringify(saved));

    expect(loadDemoData().moduleAssessments[2].score).toBe(190);
  });

  it("does not add demo history to another student account", () => {
    setCurrentUser({ ...DEMO_USER, email: "student@example.com" });

    try {
      expect(loadDemoData().classTests).toBeUndefined();
    } finally {
      setCurrentUser({ ...DEMO_USER });
    }
  });
});
