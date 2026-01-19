import { createSupabaseAdminClient } from "./supabase-admin";
import { createSupabaseServerClient } from "./supabase-server";

console.log(
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "SRK OK" : "SRK MISSING"
);

export async function createSupabaseServiceClient() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseAdminClient();
  }

  return createSupabaseServerClient();
}
