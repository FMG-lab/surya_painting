import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return console.error(error);
    setUsers(data || []);
  }

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="p-3 border rounded">
              <div className="font-medium">{u.full_name} — {u.role}</div>
              <div>Email: {u.email}</div>
              <div>Branch: {u.branch_id || '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
