import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type SupabaseServerClientOptions = {
  allowWrite?: boolean;
};

export async function createSupabaseServerClient(
  { allowWrite = false }: SupabaseServerClientOptions = {}
) {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (!allowWrite) return;
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        if (!allowWrite) return;
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}
