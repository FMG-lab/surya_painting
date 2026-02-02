import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function chainableResult(data: any) {
  const p = Promise.resolve({ data, error: null });
  const wrapper: any = {
    eq: () => p,
    order: () => wrapper,
    limit: () => wrapper,
    single: () => Promise.resolve({ data: data && data[0] ? data[0] : null, error: null }),
    then: p.then.bind(p)
  };
  return wrapper;
}

function tryLoadFixture(name: string) {
  try {
    // only attempt to load fixtures on the server (do not require fs in browser bundle)
    if (typeof window === 'undefined') {
      // require at runtime to avoid bundling in the client
      const fs = require('fs');
      const path = require('path');
      const fixturePath = path.join(process.cwd(), 'apps/admin/cypress/fixtures', `${name}.json`);
      if (fs.existsSync(fixturePath)) {
        const raw = fs.readFileSync(fixturePath, 'utf-8');
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

let _supabase: SupabaseClient;

if (!url || !anonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_* not set — running with a mock Supabase client for development.');

  const mockClient: any = {
    auth: {
      async signInWithPassword({ email }: { email: string }) {
        return { data: { user: { id: 'dev-user', email }, session: { access_token: 'dev-token' } }, error: null };
      },
      async getSession() {
        return { data: { session: { access_token: 'dev-token' } }, error: null };
      },
      async getUser(_token?: string) {
        return { data: { user: { id: 'dev-user' } }, error: null };
      }
    },
    from(_table: string) {
      // If fixtures available, return deterministic data for tests
      const fixture = tryLoadFixture(_table);
      if (fixture) {
        // support simple .eq(column, value) filtering when fixtures are used
        return {
          select: (_q: any) => {
            const wrapper: any = {
              eq: (col: string, val: any) => Promise.resolve({ data: fixture.filter((r: any) => r[col] === val), error: null }),
              single: () => Promise.resolve({ data: fixture && fixture[0] ? fixture[0] : null, error: null }),
              then: Promise.resolve({ data: fixture, error: null }).then.bind(Promise.resolve({ data: fixture, error: null }))
            };
            return wrapper;
          },
          insert: (payload: any) => Promise.resolve({ data: payload, error: null }),
          update: (payload: any) => Promise.resolve({ data: payload, error: null }),
          delete: () => Promise.resolve({ data: null, error: null }),
          order: () => ({ limit: () => Promise.resolve({ data: fixture, error: null }) })
        };
      }

      if (typeof window !== 'undefined') {
        // in browser, try to fetch fixtures from /fixtures for deterministic UI in dev/tests
        return {
          select: (_q: any) => {
            const p = fetch(`/fixtures/${_table}.json`).then(async (res) => {
              if (!res.ok) return { data: [], error: null };
              const data = await res.json();
              return { data, error: null };
            }).catch(() => ({ data: [], error: null }));

            const wrapper: any = {
              eq: (col: string, val: any) => p.then((r: any) => ({ data: (r.data || []).filter((it: any) => it[col] === val), error: null })),
              single: async () => {
                const r: any = await p;
                return { data: r.data && r.data[0] ? r.data[0] : null, error: null };
              },
              then: p.then.bind(p)
            };
            return wrapper;
          },
          insert: (payload: any) => Promise.resolve({ data: payload, error: null }),
          update: (payload: any) => Promise.resolve({ data: payload, error: null }),
          delete: () => Promise.resolve({ data: null, error: null }),
          order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) })
        };
      }

      return {
        select: (_q: any) => chainableResult([]),
        insert: (payload: any) => Promise.resolve({ data: payload, error: null }),
        update: (payload: any) => Promise.resolve({ data: payload, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) })
      };
    },
    storage: {
      from: (_bucket: string) => ({ createSignedUrl: (path: string) => Promise.resolve({ data: { signedUrl: `https://example.com/${path}` }, error: null }) })
    }
  };

  _supabase = mockClient as unknown as SupabaseClient;
} else {
  _supabase = createClient(url!, anonKey!);
}

export const supabase: SupabaseClient = _supabase;
