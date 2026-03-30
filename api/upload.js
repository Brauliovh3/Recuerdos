import { handleUpload } from "@vercel/blob/client";

export const config = { runtime: "nodejs" };

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname /* , clientPayload */) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          access: "public",
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("upload ready", blob.url);
      },
    });
    return Response.json(json);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
