-- Unified CMS Migration for Julyu
-- Seeds all pages and sections for admin-to-frontend content management

-- ============================================
-- INSERT PAGES
-- ============================================

INSERT INTO page_content (page_slug, title, meta_description, is_published, published_at)
VALUES
  ('home', 'Julyu - Stop Overpaying for Groceries', 'Compare prices across Kroger, Walmart, and more in seconds. Scan receipts, track spending, and discover savings with AI-powered intelligence.', true, NOW()),
  ('features', 'Features - Julyu', 'Everything you need to save on groceries. AI-powered price comparison, receipt scanning, and spending insights.', true, NOW()),
  ('for-stores', 'For Store Owners - Julyu', 'Bring your local store online. Connect with nearby shoppers and compete with the big chains.', true, NOW()),
  ('contact', 'Contact - Julyu', 'Get in touch with us. We''d love to hear from you.', true, NOW())
ON CONFLICT (page_slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- ============================================
-- HOME PAGE SECTIONS
-- ============================================

-- Get home page ID
DO $$
DECLARE
  home_page_id UUID;
  features_page_id UUID;
  stores_page_id UUID;
  contact_page_id UUID;
BEGIN
  SELECT id INTO home_page_id FROM page_content WHERE page_slug = 'home';
  SELECT id INTO features_page_id FROM page_content WHERE page_slug = 'features';
  SELECT id INTO stores_page_id FROM page_content WHERE page_slug = 'for-stores';
  SELECT id INTO contact_page_id FROM page_content WHERE page_slug = 'contact';

  -- HOME PAGE SECTIONS
  INSERT INTO page_sections (page_id, section_key, section_title, content, display_order, is_visible)
  VALUES
    -- Hero Section
    (home_page_id, 'hero', 'Hero Section', '{
      "badge": "Now in Early Access",
      "headline": "Stop Overpaying for Groceries",
      "subheadline": "Compare prices across Kroger, Walmart, and more in seconds. Scan receipts, track spending, and discover savings with AI-powered intelligence.",
      "primary_cta": {"text": "Get Early Access", "link": "/auth/signup"},
      "secondary_cta": {"text": "Try Demo", "link": "#demo"},
      "stats": [
        {"value": "Real-Time", "label": "Price Data"},
        {"value": "AI", "label": "Powered"},
        {"value": "Free", "label": "To Start"}
      ]
    }'::jsonb, 1, true),

    -- How It Works Section
    (home_page_id, 'how_it_works', 'How It Works', '{
      "title": "How It Works",
      "subtitle": "Get started in three simple steps",
      "steps": [
        {"number": 1, "title": "Search or Scan", "description": "Find any product or scan your receipt to get started instantly."},
        {"number": 2, "title": "Compare Prices", "description": "See real-time prices from stores near you, all in one place."},
        {"number": 3, "title": "Save Money", "description": "Choose the best deals and track your savings over time."}
      ]
    }'::jsonb, 2, true),

    -- Feature Showcase Section
    (home_page_id, 'features', 'Feature Showcase', '{
      "title": "Everything You Need to Save",
      "subtitle": "Powerful tools that put you in control of your grocery spending",
      "features": [
        {"icon": "chart", "title": "Real-Time Price Comparison", "description": "Compare prices across Kroger, Walmart, Target, and local stores instantly."},
        {"icon": "camera", "title": "AI Receipt Scanning", "description": "Just snap a photo. Our AI extracts every item and tracks your spending automatically."},
        {"icon": "bell", "title": "Smart Price Alerts", "description": "Get notified when items on your list drop in price at any store."},
        {"icon": "trending", "title": "Spending Insights", "description": "Understand your grocery habits with beautiful charts and actionable insights."},
        {"icon": "list", "title": "Smart Shopping Lists", "description": "Create lists that show you the best store to shop at for maximum savings."},
        {"icon": "map", "title": "Store Finder", "description": "Find stores near you with the best prices for your shopping list."}
      ]
    }'::jsonb, 3, true),

    -- Why Julyu Section
    (home_page_id, 'why_julyu', 'Why Julyu', '{
      "title": "Why Julyu?",
      "subtitle": "Grocery shopping shouldn''t feel like a guessing game. We built Julyu to give everyone access to the pricing intelligence that used to be reserved for big retailers.",
      "problem_stats": [
        {"stat": "$2,000+", "label": "Average yearly overspend on groceries per household"},
        {"stat": "15-25%", "label": "Price variance on identical items across stores"},
        {"stat": "2-3 hrs", "label": "Time wasted comparing prices manually each week"}
      ],
      "benefits": [
        {"icon": "chart", "title": "Compare Instantly", "description": "See prices from multiple stores side-by-side. No more driving around or flipping through apps."},
        {"icon": "camera", "title": "Scan Any Receipt", "description": "AI reads your receipts in seconds. Automatically tracks your spending and finds where you could save."},
        {"icon": "lightning", "title": "AI-Powered Insights", "description": "Smart recommendations based on your shopping habits. Find deals you actually care about."},
        {"icon": "dollar", "title": "Free to Use", "description": "Core features are free forever. No hidden fees, no credit card required to get started."}
      ]
    }'::jsonb, 4, true),

    -- Store Owner CTA Section
    (home_page_id, 'store_cta', 'Store Owner CTA', '{
      "headline": "Own a Local Store?",
      "subheadline": "Join Julyu to reach more customers and compete with the big chains. List your products and connect with shoppers in your area.",
      "cta": {"text": "Learn More", "link": "/for-stores"}
    }'::jsonb, 5, true),

    -- Final CTA Section
    (home_page_id, 'final_cta', 'Final CTA', '{
      "headline": "Ready to Start Saving?",
      "subheadline": "Join thousands of smart shoppers who are already saving with Julyu.",
      "primary_cta": {"text": "Get Started Free", "link": "/auth/signup"},
      "secondary_cta": {"text": "Learn More", "link": "/features"}
    }'::jsonb, 6, true)
  ON CONFLICT (page_id, section_key) DO UPDATE SET
    content = EXCLUDED.content,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

  -- FEATURES PAGE SECTIONS
  INSERT INTO page_sections (page_id, section_key, section_title, content, display_order, is_visible)
  VALUES
    (features_page_id, 'hero', 'Hero Section', '{
      "headline": "Everything You Need to Save",
      "subheadline": "Powerful tools that put you in control of your grocery spending"
    }'::jsonb, 1, true),

    (features_page_id, 'features', 'Features List', '{
      "features": [
        {"icon": "chart", "title": "Real-Time Price Comparison", "description": "Compare prices across 50+ retailers including Kroger, Walmart, Target, Costco, and local stores. See live prices updated every hour.", "details": ["Live price updates", "50+ retailers", "Local store coverage", "Price history charts"]},
        {"icon": "camera", "title": "AI Receipt Scanning", "description": "Our advanced AI reads your receipts in seconds. Just snap a photo and watch as every item is automatically extracted and categorized.", "details": ["99% accuracy", "Any store receipt", "Auto-categorization", "Instant processing"]},
        {"icon": "bell", "title": "Smart Price Alerts", "description": "Never miss a deal. Get notified instantly when items on your list drop in price at any store in your area.", "details": ["Custom price targets", "Multi-store tracking", "Push notifications", "Weekly deal digests"]},
        {"icon": "trending", "title": "Spending Insights", "description": "Beautiful charts and actionable insights help you understand your grocery habits and identify opportunities to save.", "details": ["Monthly reports", "Category breakdown", "Store comparison", "Savings tracking"]},
        {"icon": "list", "title": "Smart Shopping Lists", "description": "Create lists that automatically show you the best store to shop at for maximum savings on your specific items.", "details": ["Multi-store optimization", "Shareable lists", "Recurring items", "Budget tracking"]},
        {"icon": "map", "title": "Store Finder", "description": "Find the stores near you with the best prices for your shopping list. See distance, hours, and estimated total.", "details": ["GPS integration", "Store hours", "Trip planning", "Gas savings calculator"]}
      ]
    }'::jsonb, 2, true),

    (features_page_id, 'cta', 'CTA Section', '{
      "headline": "Ready to Start Saving?",
      "subheadline": "Join thousands of smart shoppers already using Julyu.",
      "cta": {"text": "Get Started Free", "link": "/auth/signup"}
    }'::jsonb, 3, true)
  ON CONFLICT (page_id, section_key) DO UPDATE SET
    content = EXCLUDED.content,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

  -- FOR-STORES PAGE SECTIONS
  INSERT INTO page_sections (page_id, section_key, section_title, content, display_order, is_visible)
  VALUES
    (stores_page_id, 'hero', 'Hero Section', '{
      "headline": "Bring Your Local Store Online",
      "subheadline": "Connect with nearby shoppers and compete with the big chains. Join the Julyu network and grow your business.",
      "cta": {"text": "Apply Now", "link": "/for-stores/apply"}
    }'::jsonb, 1, true),

    (stores_page_id, 'how_it_works', 'How It Works', '{
      "title": "How It Works",
      "steps": [
        {"number": 1, "title": "Apply to Join", "description": "Fill out a quick application to get started. We''ll review and get back to you within 48 hours."},
        {"number": 2, "title": "Upload Your Products", "description": "Add your inventory through our easy dashboard. Import from spreadsheet or add manually."},
        {"number": 3, "title": "Reach Customers", "description": "Shoppers in your area will see your prices and find your store on Julyu."}
      ]
    }'::jsonb, 2, true),

    (stores_page_id, 'benefits', 'Benefits', '{
      "title": "Why Join Julyu?",
      "benefits": [
        {"icon": "users", "title": "Reach Local Shoppers", "description": "Get discovered by customers in your neighborhood actively looking for groceries."},
        {"icon": "trending", "title": "Compete on Price", "description": "Show shoppers your competitive prices compared to big chains."},
        {"icon": "chart", "title": "Analytics Dashboard", "description": "Track views, clicks, and foot traffic from Julyu customers."},
        {"icon": "dollar", "title": "Affordable Pricing", "description": "Simple, transparent pricing that works for stores of all sizes."}
      ]
    }'::jsonb, 3, true),

    (stores_page_id, 'pricing', 'Pricing', '{
      "title": "Simple Pricing",
      "subtitle": "Choose the plan that works for your store",
      "plans": [
        {"name": "Starter", "price": "Free", "description": "Get started at no cost", "features": ["List up to 100 products", "Basic analytics", "Email support"], "cta": "Get Started"},
        {"name": "Growth", "price": "$49/mo", "description": "For growing stores", "features": ["Unlimited products", "Advanced analytics", "Priority support", "Featured placement"], "cta": "Start Trial", "popular": true},
        {"name": "Enterprise", "price": "Custom", "description": "For chains and large stores", "features": ["Multi-location support", "API access", "Dedicated account manager", "Custom integrations"], "cta": "Contact Us"}
      ]
    }'::jsonb, 4, true),

    (stores_page_id, 'faq', 'FAQ', '{
      "title": "Frequently Asked Questions",
      "questions": [
        {"question": "How long does it take to get set up?", "answer": "Most stores are live within 24-48 hours of submitting their application."},
        {"question": "What if I have multiple locations?", "answer": "Our Growth and Enterprise plans support multiple locations. Contact us for details."},
        {"question": "How do customers find my store?", "answer": "When shoppers search for products in your area, your store and prices will appear in their results."},
        {"question": "Can I update my prices in real-time?", "answer": "Yes! Our dashboard lets you update prices anytime, or you can use our API for automatic updates."}
      ]
    }'::jsonb, 5, true),

    (stores_page_id, 'cta', 'CTA Section', '{
      "headline": "Ready to Grow Your Business?",
      "subheadline": "Join hundreds of local stores already on Julyu.",
      "cta": {"text": "Apply Now", "link": "/for-stores/apply"}
    }'::jsonb, 6, true)
  ON CONFLICT (page_id, section_key) DO UPDATE SET
    content = EXCLUDED.content,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

  -- CONTACT PAGE SECTIONS
  INSERT INTO page_sections (page_id, section_key, section_title, content, display_order, is_visible)
  VALUES
    (contact_page_id, 'hero', 'Hero Section', '{
      "headline": "Get in Touch",
      "subheadline": "Have a question or feedback? We''d love to hear from you."
    }'::jsonb, 1, true),

    (contact_page_id, 'contact_info', 'Contact Information', '{
      "email": "support@julyu.com",
      "response_time": "We typically respond within 24 hours",
      "office_hours": "Monday - Friday, 9am - 6pm EST",
      "address": "Cincinnati, OH"
    }'::jsonb, 2, true),

    (contact_page_id, 'support_options', 'Support Options', '{
      "options": [
        {"icon": "email", "title": "Email Support", "description": "Send us an email and we''ll get back to you within 24 hours.", "action": "support@julyu.com"},
        {"icon": "chat", "title": "Live Chat", "description": "Chat with our team in real-time during business hours.", "action": "Start Chat"},
        {"icon": "book", "title": "Help Center", "description": "Browse our knowledge base for answers to common questions.", "action": "/help"}
      ]
    }'::jsonb, 3, true)
  ON CONFLICT (page_id, section_key) DO UPDATE SET
    content = EXCLUDED.content,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

END $$;
