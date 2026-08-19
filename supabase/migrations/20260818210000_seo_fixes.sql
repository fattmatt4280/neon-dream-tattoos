-- Fix placeholder social links that were live in site_content (contact page
-- + footer), pointing at bare platform homepages instead of real profiles.
INSERT INTO public.site_content (key, value) VALUES
  ('contact.instagram_handle', '@shyftd.ink'),
  ('contact.instagram_url', 'https://instagram.com/shyftd.ink'),
  ('contact.tiktok_handle', '@shyftd.ink'),
  ('contact.tiktok_url', 'https://www.tiktok.com/@shyftd.ink'),
  ('footer.instagram_url', 'https://instagram.com/shyftd.ink'),
  ('footer.tiktok_url', 'https://www.tiktok.com/@shyftd.ink')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
