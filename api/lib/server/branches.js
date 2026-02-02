const fs = require('fs');
const path = require('path');

function loadBranchesFixture() {
  try {
    const fixturePath = path.join(__dirname, '..', '..', 'apps', 'admin', 'public', 'fixtures', 'branches.json');
    if (fs.existsSync(fixturePath)) return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  } catch (e) {
    // ignore
  }
  return [];
}

function findBranchById(id) {
  const data = loadBranchesFixture();
  const found = data.find((b) => b.id === id || b.code === id);
  return found || null;
}

module.exports = { loadBranchesFixture, findBranchById };
