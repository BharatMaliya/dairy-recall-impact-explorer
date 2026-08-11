const API_ORIGIN = 'https://dairy-recall-api.onrender.com';

export async function onRequest(context) {
  const incomingUrl = new URL(context.request.url);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, API_ORIGIN);

  const headers = new Headers(context.request.headers);
  headers.delete('host');

  const response = await fetch(upstreamUrl, {
    method: context.request.method,
    headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
    redirect: 'manual'
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
