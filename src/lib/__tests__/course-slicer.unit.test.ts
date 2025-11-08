import { sliceSession } from "@/lib/course-slicer";

const mkCourse = (ids: Array<{ id: string; t?: number }>) => ({
  sessions: [
    {
      session_title: "S1",
      lessons: ids.map(({ id, t }) => ({
        id,
        title: id,
        timeEstimateMinutes: t,
      })) as any,
    },
  ],
});

describe("sliceSession", () => {
  it("returns null when course is complete", () => {
    const stored = {
      course: mkCourse([{ id: "l1" }]) as any,
      progress: { l1: true },
    } as any;
    expect(sliceSession(stored, 15)).toBeNull();
  });

  it("returns first uncompleted lesson within duration", () => {
    const stored = {
      course: mkCourse([
        { id: "l1", t: 10 },
        { id: "l2", t: 10 },
      ]) as any,
      progress: { l1: true },
    } as any;
    const res = sliceSession(stored, 10)!;
    expect(res.title).toBe("S1");
    expect(res.lessons.map((l) => l.id)).toEqual(["l2"]);
    expect(res.durationMinutes).toBe(10);
  });

  it("packs multiple lessons up to duration respecting order", () => {
    const stored = {
      course: mkCourse([
        { id: "l1", t: 5 },
        { id: "l2", t: 5 },
        { id: "l3", t: 10 },
      ]) as any,
      progress: {},
    } as any;
    const res = sliceSession(stored, 12)!;
    expect(res.lessons.map((l) => l.id)).toEqual(["l1", "l2"]);
  });
});
