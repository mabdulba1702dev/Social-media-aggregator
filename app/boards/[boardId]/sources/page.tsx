import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectSourceModal } from "./connect-source-modal";
import { SourceRow } from "./source-row";
import type { SourcePlatform, SourceStatus } from "./actions";

interface RawSource {
  id: string;
  platform: SourcePlatform;
  external_group_id: string;
  display_name: string | null;
  status: SourceStatus;
  connected_at: string;
  last_event_at: string | null;
}

export default async function SourcesPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", boardId)
    .single();

  if (boardError || !board) notFound();

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, platform, external_group_id, display_name, status, connected_at, last_event_at")
    .eq("board_id", boardId)
    .order("connected_at", { ascending: false })
    .returns<RawSource[]>();

  if (sourcesError) throw sourcesError;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-border px-8 py-5">
        <div>
          <Link href={`/boards/${boardId}`} className="text-[13px] text-text-muted hover:text-text">
            ← {board.name}
          </Link>
          <h1 className="mt-1 text-[22px] font-bold tracking-tight text-text">Connected groups</h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Every link posted in a connected Telegram, Discord, or WhatsApp group lands on this board automatically.
          </p>
        </div>
        <div className="mt-1 shrink-0">
          <ConnectSourceModal boardId={boardId} />
        </div>
      </div>

      <div className="flex flex-col gap-6 px-8 py-6">
        {sources.length === 0 ? (
          <p className="text-sm text-text-muted">No groups connected yet — connect one above.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sources.map((source) => (
              <SourceRow key={source.id} boardId={boardId} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
