import { mediaStore } from "../lib/store.mjs";

export default async (req, context) => {
  const id = context.params?.id || new URL(req.url).pathname.split("/").pop();
  if (!/^[a-z0-9_-]{4,64}$/i.test(id)) return new Response("Not found", { status: 404 });
  const size = new URL(req.url).searchParams.get("s") === "t" ? "t" : "f";
  const store = mediaStore();
  let res = await store.getWithMetadata(`${id}/${size}`, { type: "arrayBuffer" });
  if (!res && size === "t") res = await store.getWithMetadata(`${id}/f`, { type: "arrayBuffer" });
  if (!res) return new Response("Not found", { status: 404 });
  return new Response(res.data, {
    headers: {
      "Content-Type": res.metadata?.type || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/api/media/:id" };
