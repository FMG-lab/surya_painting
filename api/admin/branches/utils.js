const fs = require('fs');
const path = require('path');

function loadFixture() {
  try {
    // Resolve relative to repository layout regardless of cwd
    const fixturePath = path.join(__dirname, '..', '..', '..', 'apps', 'admin', 'public', 'fixtures', 'branches.json');
    if (fs.existsSync(fixturePath)) {
      return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return [];
}

function findBranchById(id) {
  const data = loadFixture();
  const found = data.find((b) => b.id === id);
  return found || null;
}

module.exports = { loadFixture, findBranchById };
