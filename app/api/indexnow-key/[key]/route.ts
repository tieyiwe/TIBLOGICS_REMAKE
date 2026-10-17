import { indexNowKey } from "@/lib/seo/indexnow";

// The IndexNow key file. Served publicly at /<INDEXNOW_KEY>.txt through a
// rewrite in next.config.js; any other key is a 404, so the route reveals
// nothing beyond what IndexNow requires to be public.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const mine = indexNowKey();
  if (!mine || key !== mine) return new Response("Not found", { status: 404 });
  return new Response(mine, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
