import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import ProofModal from '../components/ProofModal';
import ConfirmModal from '../components/ConfirmModal';

type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  proof_path: string | null;
  status: string;
  uploaded_at: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [proofModalPaymentId, setProofModalPaymentId] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchBranches();
  }, []);

  async function fetchBranches() {
    const { data } = await supabase.from('branches').select('*');
    setBranches(data || []);
  }

  async function fetchPayments() {
    setLoading(true);
    // fetch payments along with booking info to allow branch filtering
    const { data, error } = await supabase.from('payments').select('*, bookings (branch_id, created_at)').eq('status', 'pending_review');
    setLoading(false);
    if (error) return console.error(error);
    setPayments(data as Payment[]);
  }

  async function verify(paymentId: string) {
    await verifyBatch([paymentId]);
  }

  async function verifyBatch(ids: string[]) {
    if (!ids || ids.length === 0) return alert('No payments selected');
    setConfirmLoading(true);
    // optimistic update: remove items locally before server confirms
    const backup = payments.slice();
    setPayments((prev) => prev.filter((p) => !ids.includes(p.id)));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const resp = await fetch('/api/admin/payments/verify-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payment_ids: ids })
      });
      const json = await resp.json();
      if (json.error) throw new Error(json.error);
      const successCount = json.results.filter((r: any) => r.success).length;
      alert(`Processed ${json.results.length}, confirmed ${successCount}`);
      setSelectedIds([]);
    } catch (err: any) {
      // rollback
      setPayments(backup);
      alert('Batch verify failed: ' + (err.message || 'unknown'));
    } finally {
      setConfirmLoading(false);
      setConfirmModalOpen(false);
      fetchPayments();
    }
  }

  async function viewProof(paymentId: string) {
    // open modal and let it fetch signed URL
    setProofModalPaymentId(paymentId);
  }

  // Apply client-side filters (branch + date)
  const filtered = payments.filter((p: any) => {
    if (selectedBranch && p.bookings?.branch_id !== selectedBranch) return false;
    if (startDate) {
      const created = new Date(p.bookings?.created_at || p.uploaded_at);
      if (created < new Date(startDate)) return false;
    }
    if (endDate) {
      const created = new Date(p.bookings?.created_at || p.uploaded_at);
      // include the end date full day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (created > end) return false;
    }
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Payments</h2>

        <div className="mb-4 flex gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600">Branch</label>
            <select value={selectedBranch || ''} onChange={(e) => setSelectedBranch(e.target.value || null)} className="border p-1">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Start Date</label>
            <input type="date" value={startDate || ''} onChange={(e) => setStartDate(e.target.value || null)} className="border p-1" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">End Date</label>
            <input type="date" value={endDate || ''} onChange={(e) => setEndDate(e.target.value || null)} className="border p-1" />
          </div>

          <div className="ml-auto">
            <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={() => fetchPayments()}>Refresh</button>
          </div>
        </div>

        <div className="mb-3">
          <button data-cy="btn-confirm-selected" className="px-3 py-1 bg-green-600 text-white rounded mr-2" onClick={() => setConfirmModalOpen(true)}>Confirm Selected</button>
          <button data-cy="btn-clear-selection" className="px-3 py-1 bg-gray-200 rounded" onClick={() => setSelectedIds([])}>Clear Selection</button>
        </div>

        {loading && <div>Loading...</div>}
        {!loading && filtered.length === 0 && <div>No pending payments</div>}

        <div className="space-y-4">
          {filtered.map((p) => (
            <div key={p.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">Booking: {p.booking_id}</div>
                <div>Amount: Rp {p.amount}</div>
                <div>Uploaded: {new Date(p.uploaded_at).toLocaleString()}</div>
                <div>Branch: {p.bookings?.branch_id || '-'}</div>
              </div>
              <div className="space-x-2 flex items-center">
                <input data-cy={`chk-${p.id}`} type="checkbox" checked={selectedIds.includes(p.id)} onChange={(e) => {
                  if (e.target.checked) setSelectedIds((s) => [...s, p.id]); else setSelectedIds((s) => s.filter((id) => id !== p.id));
                }} />
                <button data-cy={`btn-view-proof-${p.id}`} className="px-3 py-1 bg-sky-600 text-white rounded" onClick={() => viewProof(p.id)}>View Proof</button>
                <button data-cy={`btn-confirm-${p.id}`} className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => verify(p.id)}>Confirm</button>
              </div>
            </div>
          ))}
        </div>
        {proofModalPaymentId && (
          <ProofModal paymentId={proofModalPaymentId} token={null /* fetches token internally if needed */} onClose={() => setProofModalPaymentId(null)} />
        )}
        {confirmModalOpen && (
          <ConfirmModal title="Confirm Payments" message={`Confirm ${selectedIds.length} payment(s)?`} onCancel={() => setConfirmModalOpen(false)} onConfirm={() => verifyBatch(selectedIds)} loading={confirmLoading} />
        )}
      </div>
    </Layout>
  );
}
