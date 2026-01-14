import { createSupabaseAdminClient } from "./supabase-admin";
import { createSupabaseServerClient } from "./supabase-server";

export async function createSupabaseServiceClient() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseAdminClient();
  }

  return createSupabaseServerClient();
}
