import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) return console.error(error);
    setBookings(data || []);
  }

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="p-3 border rounded">
              <div className="font-medium">{b.guest_name} — {b.plate_number}</div>
              <div>Status: {b.status} {b.queue_no ? `(Queue ${b.queue_no})` : ''}</div>
              <div>Branch: {b.branch_id}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
