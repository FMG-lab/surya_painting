// Simple test runner to execute TypeScript tests via ts-node
// Run TS tests with ts-node in transpile-only mode (skip type checking to avoid requiring dev deps)
const path = require('path');
try {
  require(path.join(__dirname, 'api', 'branches.test.js'));
  console.log('All API tests passed');
  process.exit(0);
} catch (err) {
  console.error('API tests failed');
  console.error(err);
  process.exit(1);
}
