import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBox({ query, activeTagId }: { query: string; activeTagId: string | null }) {
  return (
    <form method="get" className="flex gap-2">
      <Input name="q" defaultValue={query} placeholder="Search captions and authors" className="flex-1" />
      {activeTagId && <input type="hidden" name="tag" value={activeTagId} />}
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
