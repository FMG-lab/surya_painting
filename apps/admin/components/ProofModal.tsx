import React, { useEffect, useState } from 'react';

type Props = {
  paymentId: string | null;
  onClose: () => void;
  token?: string | null;
};

export default function ProofModal({ paymentId, onClose, token }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    let mounted = true;
    const fetchUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/admin/payments/proof?payment_id=${paymentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await resp.json();
        if (json.error) throw new Error(json.error);
        if (mounted) setUrl(json.url);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load proof');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchUrl();
    return () => {
      mounted = false;
    };
  }, [paymentId, token]);

  if (!paymentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-4 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Proof of Transfer</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && url && (
          <div className="max-h-[70vh] overflow-auto">
            {/* show image or iframe */}
            {url.endsWith('.pdf') ? (
              <iframe src={url} className="w-full h-[60vh]" />
            ) : (
              <img src={url} alt="proof" className="w-full h-auto" />
            )}
            <div className="mt-3">
              <a href={url} target="_blank" rel="noreferrer" className="text-sky-600">Open in new tab</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
