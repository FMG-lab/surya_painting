import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signIn = async () => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);
    // Redirect to payments page
    router.push('/payments');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow p-8 rounded">
        <h1 className="text-2xl font-bold mb-6">Surya Painting — Super Admin</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <input className="w-full mb-3 p-2 border" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full mb-3 p-2 border" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        <button className="w-full bg-sky-600 text-white p-2 rounded" onClick={signIn}>Sign in</button>
        <p className="text-xs text-gray-500 mt-3">Note: create a Supabase Auth user and corresponding `users` row with role = 'super_admin'</p>
      </div>
    </div>
  );
}
