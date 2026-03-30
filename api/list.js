import { list } from "@vercel/blob";

export const config = { runtime: "nodejs" };

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { blobs } = await list({ limit: 1000 });
  return Response.json({ blobs });
}
