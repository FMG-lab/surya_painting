export async function apiFetch(path: string, options?: RequestInit & { token?: string }) {
  const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
  const url = base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path;

  const headers = new Headers((options && (options as any).headers) || {});

  // Client-side default token support for convenience in dev (localStorage TEST_JWT)
  if (typeof window !== 'undefined') {
    const localToken = (options as any)?.token || (window.localStorage && window.localStorage.getItem('TEST_JWT'));
    if (localToken && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${localToken}`);
  }

  const resp = await fetch(url, { ...(options || {}), headers });
  return resp;
}
