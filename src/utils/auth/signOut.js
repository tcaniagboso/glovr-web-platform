// src/utils/auth/signOut.js
import { supabase } from "../../supabaseClient";

export async function handleSignOut(navigate) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out failed:", error.message);
    return;
  }

  navigate("/");
}
