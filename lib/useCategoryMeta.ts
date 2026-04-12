import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CategoryMeta } from '../types';

const ORDER: CategoryMeta['name'][] = ['Fresh', 'Warm', 'Floral', 'Earthy'];

export function useCategoryMeta() {
  const [categoryMeta, setCategoryMeta] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('category_meta')
      .select('*')
      .then(({ data }) => {
        if (data) {
          const sorted = [...data].sort(
            (a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name)
          );
          setCategoryMeta(sorted as CategoryMeta[]);
        }
        setLoading(false);
      });
  }, []);

  return { categoryMeta, loading };
}
