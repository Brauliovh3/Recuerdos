import { blob } from '@vercel/blob';

const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ??
  process.env.depool_READ_WRITE_TOKEN ??
  process.env.DEPPOOL_READ_WRITE_TOKEN;

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    if (!BLOB_TOKEN) {
      throw new Error(
        'Blob read-write token is missing. Set BLOB_READ_WRITE_TOKEN (or depool_READ_WRITE_TOKEN/DEPPOOL_READ_WRITE_TOKEN).'
      );
    }
    const galleryBlob = await blob.get('gallery.json', { token: BLOB_TOKEN });
    const galleryData = await galleryBlob.json();
    return new Response(JSON.stringify(galleryData), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // If the gallery.json blob does not exist, blob.get throws an error.
    // We catch it and return an empty array as the starting point for our gallery.
    if (error.code === 'NOT_FOUND') {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // For other errors, return a server error response.
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
