import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase auth session on every request. Required for
 * @supabase/ssr in the App Router — without this, users can get randomly
 * logged out because Server Components can't reliably write cookies
 * themselves (see lib/supabase/server.ts's createClient()).
 *
 * Doesn't redirect unauthenticated requests anywhere yet — there are no
 * protected routes built (Phase 1 item 4, boards). Add that redirect logic
 * here once a route actually needs to require a signed-in user.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and getClaims() — removing
  // or reordering this call is what causes users to get randomly logged out.
  await supabase.auth.getClaims();

  return response;
}
