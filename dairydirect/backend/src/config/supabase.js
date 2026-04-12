import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Test connection on startup
const { data, error } = await supabase.from("users").select("count").limit(1);
if (error) {
  console.error("❌ Supabase connection FAILED:", error.message);
} else {
  console.log("✅ Supabase connected successfully!");
}

export default supabase;