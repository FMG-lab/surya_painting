import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import BranchForm from '../components/BranchForm';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    const { data, error } = await supabase.from('branches').select('*');
    if (error) return console.error(error);
    setBranches(data || []);
  }

  const toast = useToast();

  async function createBranch(payload: any) {
    try {
      const resp = await fetch('/api/admin/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await resp.json();
      if (json.error) throw new Error(json.error || 'Create failed');
      fetchBranches();
      setFormOpen(false);
      // show toast
      toast.show('Branch created', 'success');
    } catch (e: any) {
      toast.show(e.message || 'Create failed', 'error');
      throw e;
    }
  }

  async function updateBranch(payload: any) {
    try {
      const resp = await fetch(`/api/admin/branches/${payload.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await resp.json();
      if (json.error) throw new Error(json.error || 'Update failed');
      fetchBranches();
      setFormOpen(false);
      setEditing(null);
      toast.show('Branch updated', 'success');
    } catch (e: any) {
      toast.show(e.message || 'Update failed', 'error');
      throw e;
    }
  }

  async function deleteBranch(id: string) {
    try {
      const resp = await fetch(`/api/admin/branches/${id}`, { method: 'DELETE' });
      const json = await resp.json();
      if (json.error) throw new Error(json.error || 'Delete failed');
      fetchBranches();
      setConfirmDelete(null);
      toast.show('Branch deleted', 'success');
    } catch (e: any) {
      toast.show(e.message || 'Delete failed', 'error');
      throw e;
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Branches</h2>

        <div className="mb-4">
          <button data-cy="btn-add-branch" className="px-3 py-1 bg-sky-600 text-white rounded" onClick={() => { setFormOpen(true); setEditing(null); }}>Add Branch</button>
        </div>

        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{b.name}</div>
                <div>Address: {b.address}</div>
                <div>Capacity: {b.capacity}</div>
              </div>
              <div className="space-x-2">
                <button data-cy={`btn-edit-${b.id}`} className="px-3 py-1 bg-yellow-400 rounded" onClick={() => { setEditing(b); setFormOpen(true); }}>Edit</button>
                <button data-cy={`btn-delete-${b.id}`} className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => setConfirmDelete(b)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {formOpen && (
          <BranchForm initial={editing} onCancel={() => { setFormOpen(false); setEditing(null); }} onSave={(payload) => editing ? updateBranch(payload) : createBranch(payload)} />
        )}

        {confirmDelete && (
          <ConfirmModal title="Delete Branch" message={`Delete branch ${confirmDelete.name}?`} onCancel={() => setConfirmDelete(null)} onConfirm={() => deleteBranch(confirmDelete.id)} />
        )}
      </div>
    </Layout>
  );
}
