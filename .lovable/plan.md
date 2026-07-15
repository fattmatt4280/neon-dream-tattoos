## Multi-image portfolio pieces (carousel)

Let a portfolio item hold multiple images. First uploaded = cover. Public portfolio shows a carousel per piece.

### Database
- New table `public.portfolio_images` with columns: `portfolio_item_id` (FK → `portfolio_items.id`, on delete cascade), `image_url`, `sort_order`, plus standard id/created_at.
- GRANTs: `SELECT` to `anon` + `authenticated` (portfolio is public); `INSERT/UPDATE/DELETE` to `authenticated` gated by `has_role(auth.uid(),'admin')`.
- Enable RLS + policies mirroring existing `portfolio_items` (public read, admin write).
- Backfill: copy each existing `portfolio_items.image_url` into `portfolio_images` as `sort_order = 0` so nothing disappears.
- Keep `portfolio_items.image_url` as the cover (denormalized) — set by trigger/app to the lowest-sort image so existing `og:image`, admin thumbs, and home page keep working with no query changes.

### Admin (`src/routes/admin.tsx`)
- In the portfolio Create form, replace the single-file input with a multi-file input (`<input type="file" multiple>`).
- Upload each file sequentially to the `portfolio` bucket under `portfolio_items/{itemId}/{uuid}.{ext}`, create signed URLs, then insert one `portfolio_images` row per file in upload order (`sort_order = 0..n`). First upload's URL is also written to `portfolio_items.image_url` as cover.
- Show thumbnail previews of all selected/uploaded images with an upload progress line ("Uploading 2 / 4…").
- Portfolio list rows: show cover thumb + a small "×N" badge indicating image count.
- Add an "Edit images" affordance on each existing portfolio row: opens a panel to add more images or delete individual images (keeps first-uploaded-as-cover rule; deleting the cover promotes the next image).
- Flash and Merch admin flows stay single-image (unchanged).

### Public portfolio (`src/routes/portfolio.tsx`)
- Query `portfolio_items` with nested `portfolio_images(image_url, sort_order)` ordered by `sort_order`.
- If a piece has >1 image, render a lightweight carousel inside the existing figure tile:
  - Same aspect ratio, same hover caption
  - Prev/next arrow buttons (only visible on hover / focus)
  - Dot indicators at the bottom
  - Keyboard left/right when focused; swipe on touch
  - Lazy-load non-active slides
- Single-image pieces render exactly as today (no carousel chrome).
- Home page featured grid keeps using `image_url` (cover), unchanged.

### Files touched
- New migration for `portfolio_images` (table, GRANTs, RLS, backfill).
- `src/routes/admin.tsx` — multi-upload form + edit-images panel.
- `src/routes/portfolio.tsx` — nested query + inline carousel component.
- No changes to flash/merch, storage bucket, or auth.

### Out of scope
- Reordering images (cover stays "first uploaded"; deleting cover promotes next).
- Multi-image for flash/merch.
- Full-screen lightbox.
