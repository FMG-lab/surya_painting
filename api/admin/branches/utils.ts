import fs from 'fs';
import path from 'path';

export function loadFixture(): any[] {
  try {
    // Resolve fixture relative to repository layout using __dirname (stable regardless of CWD)
    const fixturePath = path.join(__dirname, '..', '..', 'apps', 'admin', 'public', 'fixtures', 'branches.json');
    if (fs.existsSync(fixturePath)) {
      return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function findBranchById(id: string) {
  const data = loadFixture();
  const found = data.find((b: any) => b.id === id);
  return found || null;
}
