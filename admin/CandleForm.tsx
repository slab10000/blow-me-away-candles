import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Candle, ScentCategory } from '../types';
import { prepareCandleImage } from '../lib/imageUpload';
import { CANDLE_FIELDS, requireCandleStock } from '../shared/candleCatalog';
import { invalidateCandles } from '../lib/useCandles';

const CATEGORIES: ScentCategory[] = ['Fresh', 'Warm', 'Floral', 'Earthy'];

const empty = (): Omit<Candle, 'id'> => ({
  name: '',
  artist: '',
  scent: '',
  description: '',
  image: '',
  spotifyTrackId: '',
  price: 0,
  stock: 1,
  scentProfile: [],
  category: 'Fresh',
});

const CandleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id) && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(empty());
  const [scentInput, setScentInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(!isEdit);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) return;
    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  useEffect(() => {
    let active = true;
    setError('');
    setLoaded(!isEdit);
    if (!isEdit) { setForm(empty()); setImagePreview(''); return; }
    const load = async () => {
      try {
        const { data, error } = await supabase.from('candles').select(CANDLE_FIELDS).eq('id', id!)
          .abortSignal(AbortSignal.timeout(10000)).single();
        if (error) throw error;
        const { id: _id, ...rest } = requireCandleStock(data as Candle);
        if (!active) return;
        setForm(rest);
        setImagePreview(rest.image);
        setLoaded(true);
      } catch {
        if (active) setError('This candle and its availability could not be loaded. Please refresh and try again.');
      }
    };
    void load();
    return () => { active = false; };
  }, [id, isEdit]);

  const set = <K extends keyof typeof form>(key: K, val: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const addScent = () => {
    const trimmed = scentInput.trim();
    if (trimmed && !form.scentProfile.includes(trimmed)) {
      set('scentProfile', [...form.scentProfile, trimmed]);
    }
    setScentInput('');
  };

  const removeScent = (s: string) =>
    set('scentProfile', form.scentProfile.filter(x => x !== s));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setImageFile(file);
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return form.image;
    setUploading(true);
    try {
      const optimized = await prepareCandleImage(imageFile);
      const { error } = await supabase.storage.from('candle-images').upload(optimized.name, optimized, {
        contentType: 'image/webp', cacheControl: '31536000', upsert: false,
      });
      if (error) throw new Error(error.message);
      return supabase.storage.from('candle-images').getPublicUrl(optimized.name).data.publicUrl;
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loaded) return;
    setError('');
    setSaving(true);
    try {
      if (!Number.isInteger(form.stock) || form.stock < 0 || form.stock > 2147483647) {
        throw new Error('Available candles must be a whole number of zero or more.');
      }
      const imageUrl = await uploadImage();
      const payload = { ...form, image: imageUrl };

      if (isEdit) {
        const { error } = await supabase.from('candles').update(payload).eq('id', id!);
        if (error) throw error;
      } else {
        const newId = `c${Date.now()}`;
        const { error } = await supabase.from('candles').insert({ id: newId, ...payload });
        if (error) throw error;
      }

      invalidateCandles();
      navigate('/admin/candles');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
    setSaving(false);
  };

  const label = (text: string) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">{text}</label>
  );

  const input = (
    key: keyof typeof form,
    type = 'text',
    extra?: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <input
      type={type}
      value={form[key] as string | number}
      onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value as never)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      {...extra}
    />
  );

  if (!loaded) return <div className="p-8 max-w-2xl">
    <p role={error ? 'alert' : 'status'} className={error ? 'text-red-600 text-sm' : 'text-gray-500 text-sm'}>{error || 'Loading candle…'}</p>
    {error && <button type="button" onClick={() => navigate('/admin/candles')} className="mt-4 text-sm underline">Back to candles</button>}
  </div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          {isEdit ? 'Edit Candle' : 'Add Candle'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          {label('Name')}
          {input('name', 'text', { required: true, placeholder: 'Golden Hour' })}
        </div>

        {/* Artist */}
        <div>
          {label('Song Artist')}
          {input('artist', 'text', { required: true, placeholder: 'JVKE' })}
        </div>

        {/* Spotify Track ID */}
        <div>
          {label('Spotify Track ID')}
          {input('spotifyTrackId', 'text', { placeholder: '4yNk9iz9WVJikRFle3XEvn' })}
          <p className="text-xs text-gray-400 mt-1">
            The ID at the end of a Spotify track URL: open.spotify.com/track/<strong>{'<id>'}</strong>
          </p>
        </div>

        {/* Scent name */}
        <div>
          {label('Scent Name')}
          {input('scent', 'text', { required: true, placeholder: 'Sunset Sorbet' })}
        </div>

        {/* Description */}
        <div>
          {label('Description')}
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            required
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        {/* Category + Price row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {label('Category')}
            <select
              value={form.category}
              onChange={e => set('category', e.target.value as ScentCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            {label('Price ($)')}
            {input('price', 'number', { required: true, min: 0, step: 1 })}
          </div>
        </div>

        <div>
          <label htmlFor="candle-stock" className="block text-sm font-medium text-gray-700 mb-1">Available candles</label>
          {input('stock', 'number', { id: 'candle-stock', required: true, min: 0, max: 2147483647, step: 1, 'aria-describedby': 'candle-stock-help' })}
          <p id="candle-stock-help" className="text-xs text-gray-500 mt-1">How many candles are available for this scent. Set to 0 to mark it sold out.</p>
        </div>

        {/* Scent profile */}
        <div>
          {label('Scent Profile')}
          <div className="flex gap-2">
            <input
              type="text"
              value={scentInput}
              onChange={e => setScentInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addScent(); } }}
              placeholder="e.g. Citrus"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="button"
              onClick={addScent}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
          {form.scentProfile.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.scentProfile.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeScent(s)}
                    className="text-amber-400 hover:text-amber-700"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Image upload */}
        <div>
          {label('Image')}
          <div
            onClick={() => { if (!saving) fileRef.current?.click(); }}
            className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-amber-400 transition-colors text-center"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                className="mx-auto h-40 w-40 object-cover rounded-xl"
              />
            ) : (
              <div className="text-gray-400">
                <Upload size={24} className="mx-auto mb-2" />
                <p className="text-sm">Click to upload image</p>
                <p className="text-xs mt-1">PNG, JPG, WEBP</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">JPG, PNG, or WebP, up to 20 MB. Photos are resized and compressed automatically.</p>
          {imagePreview && (
            <button
              type="button"
              disabled={saving}
              onClick={() => { setImageFile(null); setImagePreview(''); set('image', ''); if (fileRef.current) fileRef.current.value = ''; }}
              className="mt-2 text-xs text-red-400 hover:text-red-600"
            >
              Remove image
            </button>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
          >
            {uploading ? 'Preparing and uploading photo…' : saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add candle'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/candles')}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CandleForm;
