const React = require("react");
const { renderHook, act } = require("@testing-library/react");

// Mock auth context provider BEFORE requiring hook
jest.mock("@/components/auth/AuthProvider", () => {
  const React = require("react");
  const Ctx = React.createContext({
    user: { id: "u1" },
    userProfile: null,
    loading: false,
  });
  return {
    useAuth: () => React.useContext(Ctx),
  };
});

// Mock data layer BEFORE requiring hook
jest.mock("@/lib/auth", () => ({
  getCourseProgress: jest.fn(async () => []),
  updateLessonProgress: jest.fn(async () => {}),
}));

// Now require the hook so it picks up mocks
const { useUserProgress } = require("@/hooks/use-user-progress");
// And grab references to mocked fns for assertions
const { getCourseProgress, updateLessonProgress } = require("@/lib/auth");

describe("useUserProgress", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads and updates progress, triggers completion callback", async () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useUserProgress("c1", "Course", 1));

    // load progress explicitly
    await act(async () => {
      await result.current.refreshProgress();
    });
    expect(getCourseProgress).toHaveBeenCalledWith("u1", "c1");

    // set callback and complete lesson
    act(() => {
      result.current.setCourseCompleteCallback(onComplete);
    });
    await act(async () => {
      await result.current.markLessonComplete("l1", 90, 120);
    });

    expect(updateLessonProgress).toHaveBeenCalledWith("u1", "c1", "l1", {
      completed: true,
      score: 90,
      timeSpent: 120,
    });
    expect(result.current.isLessonCompleted("l1")).toBe(true);
    const status = result.current.getCourseCompletionStatus();
    expect(status.isCompleted).toBe(true);
    expect(onComplete).toHaveBeenCalled();
  });
});
