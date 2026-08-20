import { createClient } from "@supabase/supabase-js";
import { handleIncomingMessage as sharedHandleIncomingMessage, type IncomingMessage } from "../../lib/ingestion/pipeline.js";

export type { IncomingMessage } from "../../lib/ingestion/pipeline.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Service-role client: this worker acts on behalf of any board's connected
// source, not a single logged-in user, so it must bypass RLS. See CLAUDE.md's
// Supabase-access convention.
const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));

export function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  return sharedHandleIncomingMessage(supabase, message);
}
