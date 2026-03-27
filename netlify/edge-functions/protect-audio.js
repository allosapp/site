/**
 * protect-audio.js
 *
 * Netlify Edge Function — guards /assets/audio/*.mp3
 *
 * Allows requests that originate from allos.app (i.e. the breath pacer page
 * fetching audio via the Web Audio API). Blocks direct browser navigation,
 * link scrapers, and download tools that do not send a matching Referer.
 */

export default async function protectAudio(request) {
  const referer = request.headers.get('referer') || '';

  if (referer.startsWith('https://allos.app/') || referer.startsWith('https://www.allos.app/')) {
    return; // allow — pass through to the static asset
  }

  return new Response('Access denied', { status: 403 });
}

export const config = {
  path: '/assets/audio/*',
};
