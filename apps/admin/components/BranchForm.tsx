import React, { useEffect, useState } from 'react';

type Props = {
  initial?: { id?: string; name?: string; address?: string; capacity?: number } | null;
  onCancel: () => void;
  onSave: (payload: any) => Promise<void> | void;
};

export default function BranchForm({ initial = null, onCancel, onSave }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [capacity, setCapacity] = useState<number>(initial?.capacity || 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initial?.name || '');
    setAddress(initial?.address || '');
    setCapacity(initial?.capacity || 1);
  }, [initial]);

  const [errors, setErrors] = useState<{ name?: string; capacity?: string }>({});

  async function submit() {
    const e: any = {};
    if (!name || name.trim().length < 3) e.name = 'Name must be at least 3 characters';
    if (!capacity || capacity < 1) e.capacity = 'Capacity must be at least 1';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await onSave({ id: initial?.id, name: name.trim(), address: address?.trim(), capacity });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">{initial?.id ? 'Edit Branch' : 'Add Branch'}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600">Name</label>
            <input data-cy="branch-name" value={name} onChange={(e) => setName(e.target.value)} className="border p-1 w-full" />
            {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-600">Address</label>
            <input data-cy="branch-address" value={address} onChange={(e) => setAddress(e.target.value)} className="border p-1 w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Capacity</label>
            <input data-cy="branch-capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="border p-1 w-full" />
            {errors.capacity && <div className="text-red-600 text-sm mt-1">{errors.capacity}</div>}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button data-cy="branch-form-cancel" className="px-3 py-1 rounded" onClick={onCancel} disabled={loading}>Cancel</button>
          <button data-cy="branch-form-submit" className="px-3 py-1 bg-sky-600 text-white rounded" onClick={submit} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
