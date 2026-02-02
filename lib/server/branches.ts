import fs from 'fs';
import path from 'path';

export function loadBranchesFixture(): any[] {
  try {
    // Resolve fixture path relative to this file so it works regardless of process.cwd()
    const fixturePath = path.join(__dirname, '..', '..', 'apps', 'admin', 'public', 'fixtures', 'branches.json');
    // debug
    // console.log('[DEBUG] loadBranchesFixture path=', fixturePath, 'exists=', fs.existsSync(fixturePath));
    if (fs.existsSync(fixturePath)) return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  } catch (e) {
    // ignore
  }
  return [];
}

export function findBranchById(id: string) {
  const data = loadBranchesFixture();
  // debug
  // console.log('[DEBUG] findBranchById id=', id, 'data len=', data.length);
  const found = data.find((b: any) => b.id === id || b.code === id);
  return found || null;
}

export function findBranchById(id: string) {
  const data = loadBranchesFixture();
  const found = data.find((b: any) => b.id === id || b.code === id);
  return found || null;
}
