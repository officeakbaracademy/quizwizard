// Vercel function: the online version of the proxy in vite.config.js.
// The browser calls /api/v1/..., vercel.json sends that here, and this
// forwards it to the backend with the token added. The token lives in
// Vercel's settings (API_TOKEN), so it never reaches the browser.

export default async function handler(req, res) {
  const target = process.env.VITE_API_TARGET;
  if (!target) {
    res.status(500).json({ error: 'VITE_API_TARGET is not set in Vercel' });
    return;
  }

  // __path is the part after /api/v1/; everything else is the real query.
  const { __path = '', ...query } = req.query;
  const path = Array.isArray(__path) ? __path.join('/') : __path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  const search = params.toString();
  const url = `${target.replace(/\/+$/, '')}/api/v1/${path}${search ? `?${search}` : ''}`;

  const headers = { 'ngrok-skip-browser-warning': '1' };
  if (process.env.API_TOKEN) headers.Authorization = `Bearer ${process.env.API_TOKEN}`;
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

  const hasBody = !['GET', 'HEAD'].includes(req.method) && req.body != null;
  const body = hasBody ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined;

  try {
    const reply = await fetch(url, { method: req.method, headers, body });
    res.status(reply.status);
    const type = reply.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);
    res.send(Buffer.from(await reply.arrayBuffer()));
  } catch (err) {
    res.status(502).json({ error: `Couldn't reach the backend: ${err.message}` });
  }
}
