import React from 'react';

type Props = {
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function ConfirmModal({ title = 'Confirm', message = 'Are you sure?', onConfirm, onCancel, loading }: Props) {
  return (
    <div data-cy="confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button data-cy="confirm-modal-cancel" className="px-3 py-1 rounded" onClick={onCancel} disabled={loading}>Cancel</button>
          <button data-cy="confirm-modal-confirm" className="px-3 py-1 bg-red-600 text-white rounded" onClick={onConfirm} disabled={loading}>{loading ? 'Processing...' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
