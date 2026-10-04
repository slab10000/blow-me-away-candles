# Photo storage and loading

Product photos live in the public Supabase `candle-images` bucket. Database rows
store their public URLs, not image bytes. The storefront uses a direct candle
photo first, then a matching scent's hero photo, then a product photo.

The admin accepts JPG, PNG, and WebP files up to 20 MB. Before uploading it:

- Preserves the image proportions and reduces the longest edge to at most 1,200 px.
- Encodes WebP at quality 82 in a Web Worker, including in Safari.
- Uploads under a new UUID filename with `Content-Type: image/webp` and a one-year
  browser cache lifetime. A replacement gets a new URL, so long caching does not
  prevent a newly saved photo from appearing.

The encoder and its WASM assets load only for an admin upload. Store visitors do
not download them. Admin, category, cart, and checkout screens use separate
JavaScript chunks. Decorative flame animations use CSS, without a motion library.

After the first page load gets idle time (with a bounded fallback for slow external
resources and Safari), all product images warm at low fetch priority. Spotify
players load eagerly in a background queue, three at a time. Nearby players get
priority, but every player is queued without scrolling. A six-second slot timeout
prevents a stalled embed from holding up the rest. Unmounting cancels pending jobs.
This preloads player interfaces; Spotify still controls audio buffering and playback.
Collection sections are visible immediately instead of waiting for scroll animations.
Lato and Playfair Display are hosted as local WOFF2 assets with `font-display: swap`,
so the first render no longer waits for Google's external font stylesheet.

The hero uses a preloaded, high-priority 1,920 × 1,080 WebP. Original PNG files are
retained as source assets but are not imported into the production bundle.
Vercel gives fingerprinted files under `/assets/` a one-year immutable cache
lifetime. New builds change filenames; the HTML entry point remains revalidated.

Catalog rows and photo references load concurrently. In-memory snapshots keep
navigation from clearing an already-loaded collection; mounted views revalidate
against Supabase. Prices and data are not permanently cached in local storage.

## Existing images

`node scripts/optimize-existing-images.mjs` creates a local optimization report.
It requires Python 3 with Pillow's WebP support. To publish the copies and update
only references which have not changed since the script read them, supply the
server-only `SUPABASE_SERVICE_ROLE_KEY` and add `--apply`.

Original objects are retained. Optimized copies use content-addressed paths under
`optimized/v1/`, and rerunning skips already-migrated URLs. The temporary manifest
records each old and new URL for recovery. Only URLs belonging to this project's
public candle bucket are processed.
