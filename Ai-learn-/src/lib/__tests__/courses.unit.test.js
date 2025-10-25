const chain = () => {
  const o = {};
  o.insert = jest.fn(() => o);
  o.update = jest.fn(() => o);
  o.select = jest.fn(() => o);
  o.single = jest.fn();
  o.eq = jest.fn(() => o);
  o.order = jest.fn(() => o);
  return o;
};

const mockFrom = jest.fn();
const mockSupabase = { from: mockFrom };

jest.mock("@/lib/supabaseClient", () => ({
  supabase: mockSupabase,
}));

const {
  saveCourse,
  getUserCourses,
  updateLessonProgress,
  getCourseProgress,
} = require("@/lib/auth");

describe("course data layer (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saveCourse inserts and returns id on success, falls back to tmp id on error", async () => {
    const c1 = chain();
    c1.single.mockResolvedValueOnce({ data: { id: "abc" }, error: null });
    mockFrom.mockReturnValueOnce(c1);

    const id = await saveCourse("u1", { title: "T", sessions: [] });
    expect(id).toBe("abc");

    const c2 = chain();
    c2.single.mockResolvedValueOnce({ data: null, error: new Error("fail") });
    mockFrom.mockReturnValueOnce(c2);
    const id2 = await saveCourse("u1", { title: "T", sessions: [] });
    expect(id2).toMatch(/^tmp_/);
  });

  it("getUserCourses returns mapped rows and [] on error", async () => {
    const rows = [
      {
        id: "c1",
        course: { title: "A", sessions: [] },
        progress: [],
        saved_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      },
    ];
    const c1 = chain();
    c1.order.mockResolvedValueOnce({ data: rows, error: null });
    mockFrom.mockReturnValueOnce(c1);
    const list = await getUserCourses("u1");
    expect(list).toHaveLength(1);
    expect(list[0].courseId).toBe("c1");

    const c2 = chain();
    c2.order.mockResolvedValueOnce({ data: null, error: new Error("boom") });
    mockFrom.mockReturnValueOnce(c2);
    const empty = await getUserCourses("u1");
    expect(empty).toEqual([]);
  });

  it("updateLessonProgress reads, merges, and updates progress", async () => {
    const c1 = chain();
    // First single(): fetch progress, then update path resolves
    c1.single
      .mockResolvedValueOnce({ data: { progress: [] }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mockFrom.mockReturnValue(c1);

    await updateLessonProgress("u1", "course1", "lesson1", { completed: true });
    expect(c1.update).toHaveBeenCalled();
  });

  it("getCourseProgress returns [] on error and maps dates when present", async () => {
    const p = [
      {
        courseId: "c1",
        lessonId: "l1",
        completed: true,
        completedAt: new Date().toISOString(),
      },
    ];
    const c1 = chain();
    c1.single.mockResolvedValueOnce({ data: { progress: p }, error: null });
    mockFrom.mockReturnValueOnce(c1);
    const res = await getCourseProgress("u1", "c1");
    expect(res[0].completed).toBe(true);
    expect(res[0].completedAt instanceof Date).toBe(true);

    const c2 = chain();
    c2.single.mockResolvedValueOnce({ data: null, error: new Error("fail") });
    mockFrom.mockReturnValueOnce(c2);
    const res2 = await getCourseProgress("u1", "c1");
    expect(res2).toEqual([]);
  });
});
