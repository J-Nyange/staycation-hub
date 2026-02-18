// /api/getUserData.js
import { auth } from "@clerk/clerk-sdk-node";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // Verify Clerk token from frontend
    const { userId } = await auth(req);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Query Supabase table for this user
    const { data, error } = await supabase
      .from("your_table")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Supabase query failed" });
    }

    res.status(200).json({ user: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
