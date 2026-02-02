export type User = { id: string; role: string } | null;

export function getUserFromReq(req: any): User {
  const headers = (req && req.headers) || {};
  // support x-user-role for tests/dev
  const role = headers['x-user-role'] || headers['X-User-Role'];
  const id = headers['x-user-id'] || headers['X-User-Id'] || 'mock-user';
  if (role) return { id: String(id), role: String(role) };

  const auth = headers['authorization'] || headers['Authorization'];
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    // token-to-role mapping for local tests / dev helpers
    if (token === 'admin-token') return { id: 'admin', role: 'admin' };
    if (token === 'manager-token') return { id: 'manager', role: 'manager' };
    if (token === 'tech-token') return { id: 'tech', role: 'technician' };
  }

  return null;
}

export function requireRole(req: any, res: any, allowedRoles: string[]) {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthenticated' });
    // throw to stop handler flow in tests
    throw new Error('Unauthenticated');
  }
  if (!allowedRoles.includes(user.role)) {
    res.status(403).json({ error: 'Forbidden' });
    throw new Error('Forbidden');
  }
  return user;
}
