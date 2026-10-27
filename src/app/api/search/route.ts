import { search, getSearchDocs } from "@/lib/search";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 100);
  const hits = q.trim().length >= 2 ? search(await getSearchDocs(), q) : [];
  return Response.json({ q, hits }, { headers: { "Cache-Control": "public, max-age=300" } });
}
