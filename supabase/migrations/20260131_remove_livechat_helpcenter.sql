-- Remove Live Chat and Help Center from contact page support options
-- This updates the existing database content

UPDATE page_sections
SET content = jsonb_set(
  content,
  '{options}',
  '[{"icon": "email", "title": "Email Support", "description": "Send us an email and we'\''ll get back to you within 24 hours.", "action": "support@julyu.com"}]'::jsonb
)
WHERE section_key = 'support_options'
AND page_id IN (SELECT id FROM page_content WHERE page_slug = 'contact');
