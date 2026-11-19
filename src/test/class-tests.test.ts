import { describe, expect, it } from "vitest";

import {
  didPassClassTest,
  lessonTest,
  moduleAssessment,
  QUESTIONS_PER_MODULE_ASSESSMENT_LESSON,
} from "@/campusly/classTests";

describe("class-test pass threshold", () => {
  it("fails scores below 75 percent and passes scores at or above 75 percent", () => {
    expect(didPassClassTest(7, 10)).toBe(false);
    expect(didPassClassTest(3, 4)).toBe(true);
    expect(didPassClassTest(4, 4)).toBe(true);
  });

  it("does not pass a test with no questions", () => {
    expect(didPassClassTest(0, 0)).toBe(false);
  });

  it("builds a fixed five-question-per-lesson module assessment", () => {
    const course = {
      id: 2,
      sessions: [{ num: 1 }, { num: 2 }, { num: 3 }],
    };
    const assessment = moduleAssessment(course);

    expect(assessment).toHaveLength(
      course.sessions.length * QUESTIONS_PER_MODULE_ASSESSMENT_LESSON,
    );
    for (const session of course.sessions) {
      const lessonQuestions = assessment.filter(
        (question) => question.lessonNum === session.num,
      );
      expect(lessonQuestions).toHaveLength(QUESTIONS_PER_MODULE_ASSESSMENT_LESSON);
      expect(lessonQuestions.map(({ q, options, answer }) => ({ q, options, answer }))).toEqual(
        lessonTest(course.id, session.num)
          .slice(0, QUESTIONS_PER_MODULE_ASSESSMENT_LESSON)
          .map(({ q, options, answer }) => ({ q, options, answer })),
      );
    }
    expect(moduleAssessment(course)).toEqual(assessment);
  });
});
