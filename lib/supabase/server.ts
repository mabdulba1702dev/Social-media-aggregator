import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client for use in Server Components/Route Handlers,
 * bound to the current request's auth cookies. Still uses the anon key and
 * is still subject to RLS — this is NOT the service-role client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no request context to
            // write to — safe to ignore if middleware handles session
            // refresh (standard Next.js + Supabase SSR caveat).
          }
        }
      }
    }
  );
}

/**
 * Service-role client — bypasses Row Level Security entirely. Only ever
 * use this in trusted server contexts (ingestion webhooks/workers), never
 * in anything reachable with a user-supplied session. See
 * docs/database-schema.md's "Important operational note."
 */
export function createServiceRoleClient() {
  // Deliberately a separate, explicit function rather than a flag on the
  // client above — makes every call site that bypasses RLS grep-able.
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
