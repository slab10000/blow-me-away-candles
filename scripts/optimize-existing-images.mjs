// One-time maintenance: leave originals intact and update only unchanged image references.
// Requires Python with Pillow, SUPABASE_SERVICE_ROLE_KEY, and an explicit --apply flag.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';
const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
const apply = process.argv.includes('--apply');
if (apply && !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set the server-only SUPABASE_SERVICE_ROLE_KEY to apply this migration.');
const url = env.VITE_SUPABASE_URL;
const db = createClient(url, apply ? env.SUPABASE_SERVICE_ROLE_KEY : env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const prefix = `${url}/storage/v1/object/public/candle-images/`;
const directory = mkdtempSync(path.join(tmpdir(), 'bma-optimized-'));
const conversion = `from PIL import Image, ImageOps\nimport sys,json\nwith Image.open(sys.argv[1]) as source:\n image=ImageOps.exif_transpose(source)\n before=image.size\n image.thumbnail((1200,1200),Image.Resampling.LANCZOS)\n if image.mode not in ('RGB','RGBA'): image=image.convert('RGBA' if 'transparency' in image.info else 'RGB')\n image.save(sys.argv[2],'WEBP',quality=82,method=6)\n print(json.dumps({'before':before,'after':image.size}))\n`;
const tables = {};
for (const [table, fields] of [['candles', 'id,image'], ['scents', 'id,heroImage'], ['products', 'id,images']]) {
 const { data, error } = await db.from(table).select(fields); if (error) throw error; tables[table] = data;
}
const sources = [...new Set([...tables.candles.map(r=>r.image), ...tables.scents.map(r=>r.heroImage), ...tables.products.flatMap(r=>r.images || [])])]
 .filter(value=>value?.startsWith(prefix) && !value.startsWith(`${prefix}optimized/v1/`));
const manifest = [];
for (const source of sources) {
 const response = await fetch(source); if(!response.ok) throw new Error(`Image read failed: ${response.status}`);
 const bytes = Buffer.from(await response.arrayBuffer());
 const id = createHash('sha256').update(bytes).update('webp-q82-max1200-v1').digest('hex');
 const original = path.join(directory, `${id}.original`), optimized = path.join(directory, `${id}.webp`);
 writeFileSync(original, bytes);
 const dimensions = JSON.parse(execFileSync('python3',['-c',conversion,original,optimized],{encoding:'utf8'}));
 const result = readFileSync(optimized);
 const objectPath = `optimized/v1/${id}.webp`;
 const target = `${prefix}${objectPath}`;
 const row = { source, target, beforeBytes:bytes.length, afterBytes:result.length, ...dimensions };
 manifest.push(row);
 if(apply) {
  const { error } = await db.storage.from('candle-images').upload(objectPath,result,{ contentType:'image/webp',cacheControl:'31536000',upsert:false });
  if(error && !['409','400'].includes(String(error.statusCode))) throw error;
  const verification = await fetch(target);
  if(!verification.ok || verification.headers.get('content-type') !== 'image/webp' || !Buffer.from(await verification.arrayBuffer()).equals(result)) throw new Error('Uploaded image verification failed.');
 }
 console.log(JSON.stringify(row));
}
writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2));
if(apply) {
 const mapping = new Map(manifest.map(row=>[row.source,row.target]));
 for(const [table,field] of [['candles','image'],['scents','heroImage'],['products','images']]) {
  for(const row of tables[table]) {
   const previous = row[field];
   const next = Array.isArray(previous) ? previous.map(image=>mapping.get(image)||image) : mapping.get(previous)||previous;
   if(JSON.stringify(previous)===JSON.stringify(next)) continue;
   const comparison = Array.isArray(previous) ? `{${previous.map(image=>JSON.stringify(image)).join(',')}}` : previous;
   const {data,error} = await db.from(table).update({[field]:next}).eq('id',row.id).eq(field,comparison).select('id');
   if(error) throw error;
   if(data.length!==1) throw new Error(`${table}/${row.id} changed during optimization; preserve the concurrent edit and rerun.`);
   console.log(`Updated ${table}/${row.id}`);
  }
 }
}
console.log(JSON.stringify({applied:apply,images:manifest.length,beforeBytes:manifest.reduce((n,r)=>n+r.beforeBytes,0),afterBytes:manifest.reduce((n,r)=>n+r.afterBytes,0),manifest:path.join(directory,'manifest.json')}));
