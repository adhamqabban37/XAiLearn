jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/lib/authSupabase", () => ({
  signIn: jest.fn(),
}));

jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ user: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
  isSupabaseConfigured: true,
}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "../LoginForm";
import { signIn } from "@/lib/authSupabase";

describe("<LoginForm />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls signIn on submit", async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({ uid: "u1" });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "e@x.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(signIn).toHaveBeenCalledWith("e@x.com", "pass"));
  });

  it("shows error on signIn failure", async () => {
    (signIn as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-credential",
      message: "invalid",
    });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "e@x.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
