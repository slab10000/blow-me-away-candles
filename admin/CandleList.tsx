import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCandles } from '../lib/useCandles';

const CandleList: React.FC = () => {
  // Deleting a candle must never delete photos borrowed from a scent or product.
  const { candles, loading } = useCandles({ includeScentPhotos: false });
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Delete this candle?')) return;
    setDeleting(id);

    // If image is in Supabase Storage, delete it too
    if (imageUrl.includes('supabase')) {
      const path = imageUrl.split('/candle-images/')[1];
      if (path) await supabase.storage.from('candle-images').remove([path]);
    }

    await supabase.from('candles').delete().eq('id', id);
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-400 text-sm">Loading candles…</div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Candles</h1>
          <p className="text-gray-400 text-sm mt-0.5">{candles.length} in collection</p>
        </div>
        <Link
          to="/admin/candles/new"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add candle
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-14">Image</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Artist</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Available</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {candles.map(candle => (
              <tr key={candle.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <img
                    src={candle.image}
                    alt={candle.name}
                    className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 leading-tight">{candle.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{candle.scent}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{candle.artist}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                    {candle.category}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">${candle.price}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${candle.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {candle.stock > 0 ? `${candle.stock} in stock` : 'Sold out'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      to={`/admin/candles/${candle.id}`}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(candle.id, candle.image)}
                      disabled={deleting === candle.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandleList;
