function getUserFromReq(req) {
  const headers = (req && req.headers) || {};
  const role = headers['x-user-role'] || headers['X-User-Role'];
  const id = headers['x-user-id'] || headers['X-User-Id'] || 'mock-user';
  if (role) return { id: String(id), role: String(role) };

  const auth = headers['authorization'] || headers['Authorization'];
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (token === 'admin-token') return { id: 'admin', role: 'admin' };
    if (token === 'manager-token') return { id: 'manager', role: 'manager' };
    if (token === 'tech-token') return { id: 'tech', role: 'technician' };
  }

  return null;
}

function requireRole(req, res, allowedRoles) {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthenticated' });
    throw new Error('Unauthenticated');
  }
  if (!allowedRoles.includes(user.role)) {
    res.status(403).json({ error: 'Forbidden' });
    throw new Error('Forbidden');
  }
  return user;
}

module.exports = { getUserFromReq, requireRole };
