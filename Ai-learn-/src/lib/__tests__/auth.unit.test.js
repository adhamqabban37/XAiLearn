const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
};

jest.mock("@/lib/supabaseClient", () => ({
  supabase: mockSupabase,
}));

const {
  signUp,
  signIn,
  logOut,
  getCurrentUser,
} = require("@/lib/authSupabase");

describe("authSupabase (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signUp returns user id on success", async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });
    const res = await signUp("e@x.com", "secret", "User");
    expect(mockSupabase.auth.signUp).toHaveBeenCalled();
    expect(res).toEqual({ id: "u1" });
  });

  it("signUp throws on error", async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("fail"),
    });
    await expect(signUp("e@x.com", "secret", "User")).rejects.toThrow("fail");
  });

  it("signIn returns user id on success", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u2" } },
      error: null,
    });
    const res = await signIn("e@x.com", "secret");
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    expect(res).toEqual({ id: "u2" });
  });

  it("logOut calls supabase.signOut", async () => {
    mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
    await logOut();
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it("getCurrentUser maps to AppUser", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "u3",
          email: "e@x.com",
          user_metadata: { display_name: "U" },
        },
      },
    });
    const u = await getCurrentUser();
    expect(u).toEqual({ uid: "u3", email: "e@x.com", displayName: "U" });
  });

  it("getCurrentUser returns null when no session", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
    const u = await getCurrentUser();
    expect(u).toBeNull();
  });
});
