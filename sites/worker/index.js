const ASSET_EXTENSIONS = new Set([
  '.css',
  '.gif',
  '.html',
  '.ico',
  '.jpg',
  '.jpeg',
  '.js',
  '.json',
  '.map',
  '.png',
  '.svg',
  '.txt',
  '.webp',
  '.woff',
  '.woff2'
]);

function hasAssetExtension(pathname) {
  const dotIndex = pathname.lastIndexOf('.');
  return dotIndex >= 0 && ASSET_EXTENSIONS.has(pathname.slice(dotIndex).toLowerCase());
}

async function serveAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) return response;
  return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {status: 405});
    }

    if (url.pathname.startsWith('/assets/') || hasAssetExtension(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    return serveAsset(request, env);
  }
};
