console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

import { supabase } from "./lib/supabaseClient";

async function testConnection() {
  const { data, error } = await supabase.auth.getUser();
  console.log("Data:", data, "Error:", error);
}

testConnection();
