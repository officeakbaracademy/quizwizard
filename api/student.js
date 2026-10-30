// Vercel function: the online version of the /student-api proxy in
// vite.config.js. The browser calls /student-api/..., vercel.json sends that
// here, and this forwards it to the school's student subjects API with the
// API key added. The key lives in Vercel's settings (STUDENT_API_KEY), so it
// never reaches the browser.

export default async function handler(req, res) {
  const target = process.env.STUDENT_API_TARGET;
  if (!target) {
    res.status(500).json({ success: false, error: 'STUDENT_API_TARGET is not set in Vercel' });
    return;
  }

  // __path is the part after /student-api/; everything else is the real query.
  const { __path = '', ...query } = req.query;
  const path = Array.isArray(__path) ? __path.join('/') : __path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  const search = params.toString();
  const url = `${target.replace(/\/+$/, '')}/${path}${search ? `?${search}` : ''}`;

  try {
    const reply = await fetch(url, {
      headers: {
        apiKey: process.env.STUDENT_API_KEY || '',
        'ngrok-skip-browser-warning': '1',
      },
    });
    res.status(reply.status);
    const type = reply.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);
    res.send(Buffer.from(await reply.arrayBuffer()));
  } catch (err) {
    res.status(502).json({ success: false, error: `Couldn't reach the school server: ${err.message}` });
  }
}
