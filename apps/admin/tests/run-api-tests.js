// Simple test runner to execute TypeScript tests via ts-node
// Register ts-node to allow requiring .ts files (transpile-only)
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const path = require('path');
try {
  require(path.join(__dirname, 'api', 'branches.test.js'));
  require(path.join(__dirname, 'api', 'bookings.test.js'));
  require(path.join(__dirname, 'api', 'bookings_status.test.js'));
  require(path.join(__dirname, 'api', 'payments_banks.test.js'));
  require(path.join(__dirname, 'api', 'payments_notify.test.js'));
  require(path.join(__dirname, 'api', 'admin_staff.test.js'));
  require(path.join(__dirname, 'api', 'manager_bookings.test.js'));
  require(path.join(__dirname, 'api', 'technicians_tasks.test.js'));
  require(path.join(__dirname, 'api', 'admin_verify_batch.test.js'));
  require(path.join(__dirname, 'api', 'admin_payments_proof.test.js'));
  console.log('All API tests passed');
  process.exit(0);
} catch (err) {
  console.error('API tests failed');
  console.error(err);
  process.exit(1);
}
