import { blob } from '@vercel/blob';

const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ??
  process.env.depool_READ_WRITE_TOKEN ??
  process.env.DEPPOOL_READ_WRITE_TOKEN;

export const config = {
  runtime: 'nodejs',
};

// This function is critical to prevent race conditions.
// It will read the existing gallery, add a new entry, and write it back.
// Vercel Serverless functions are single-threaded and this operation
// should be atomic enough for this application's scale.
export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

    try {
      const { url, contentType, size, pathname } = await request.json();

      // Basic validation
      if (!url || !contentType || !size || !pathname) {
        return new Response('Bad Request: Missing required fields.', { status: 400 });
      }

      if (!BLOB_TOKEN) {
        throw new Error(
          'Blob read-write token is missing. Set BLOB_READ_WRITE_TOKEN (or depool_READ_WRITE_TOKEN/DEPPOOL_READ_WRITE_TOKEN).'
        );
      }

      let galleryData = [];
      try {
        const galleryBlob = await blob.get('gallery.json', { token: BLOB_TOKEN });
        galleryData = await galleryBlob.json();
      } catch (error) {
        if (error.code !== 'NOT_FOUND') {
          throw error; // Re-throw if it's not a 'not found' error
        }
        // If gallery.json does not exist, we start with an empty array.
      }

      // Add new entry
    const newEntry = {
      url,
      pathname,
      contentType,
      size,
      uploadedAt: new Date().toISOString(),
    };
    galleryData.unshift(newEntry); // Add to the beginning of the array

    // Put the updated gallery back into the blob store
    await blob.put('gallery.json', JSON.stringify(galleryData), {
      access: 'public', // Or 'private' if you want to restrict access
      addRandomSuffix: false, // We want a predictable file name
      token: BLOB_TOKEN,
    });

    return new Response(JSON.stringify({ success: true, entry: newEntry }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
