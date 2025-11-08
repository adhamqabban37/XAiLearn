import { supabase } from "@/lib/supabaseClient";

async function main() {
  console.log(
    "isSupabaseConfigured:",
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );
  const { data: user, error: userErr } = await supabase.auth.getUser();
  console.log("auth.getUser error?", userErr?.message);
  console.log("auth.getUser user?", !!user?.user);

  // Attempt a harmless query (will rely on RLS)
  const { data, error } = await supabase
    .from("user_courses")
    .select("count", { count: "exact", head: true });
  console.log("user_courses head select:", {
    error: error?.message,
    hasData: Boolean(data),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
