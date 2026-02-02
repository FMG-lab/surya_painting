// Integration test runner - requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
(async () => {
  try {
    const hasEnv = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasEnv) {
      console.log('Skipping integration tests: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
      process.exit(0);
    }

    require('./integration/supabase_rpc.test.js');
    require('./integration/storage.test.js');

    console.log('All integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Integration tests failed');
    console.error(err);
    process.exit(1);
  }
})();
