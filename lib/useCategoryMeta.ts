import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CategoryMeta } from '../types';

const ORDER: CategoryMeta['name'][] = ['Fresh', 'Warm', 'Floral', 'Earthy'];
let snapshot: CategoryMeta[] | undefined;
let pending: Promise<CategoryMeta[]> | undefined;

function fetchCategories() {
  if (pending) return pending;
  pending = Promise.resolve(supabase.from('category_meta').select('name,subtitle')).then(({ data, error }) => {
    if (error) throw error;
    snapshot = ((data || []) as CategoryMeta[]).sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
    return snapshot;
  }).finally(() => { pending = undefined; });
  return pending;
}

export function useCategoryMeta() {
  const [categoryMeta, setCategoryMeta] = useState<CategoryMeta[]>(() => snapshot || []);
  const [loading, setLoading] = useState(() => !snapshot);

  useEffect(() => {
    let active = true;
    void fetchCategories().then(data => { if (active) setCategoryMeta(data); })
      .catch(() => { /* Keep the last successful public category list on a transient failure. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { categoryMeta, loading };
}
