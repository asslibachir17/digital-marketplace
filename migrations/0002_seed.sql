-- Migration: 0002_seed.sql
-- Sample product seed data

INSERT INTO products (id, name, slug, description, short_desc, price, category, tags, file_key, file_name, cover_url, featured, active)
VALUES
  (
    'prod_001',
    'Obsidian UI Kit Pro',
    'obsidian-ui-kit-pro',
    'A comprehensive Figma UI kit with 500+ components, dark & light themes, and full design tokens. Perfect for building modern web applications with a consistent design system. Includes typography scales, color palettes, spacing systems, and interactive prototyping components.',
    'Premium Figma UI kit with 500+ components and full design tokens',
    4900,
    'Design Assets',
    '["figma","ui-kit","design-system","components"]',
    'products/obsidian-ui-kit-pro.zip',
    'obsidian-ui-kit-pro.zip',
    '/covers/ui-kit.jpg',
    1,
    1
  ),
  (
    'prod_002',
    'Next.js SaaS Starter Kit',
    'nextjs-saas-starter',
    'Production-ready Next.js 14 boilerplate with authentication, billing, database, and admin panel. Includes Stripe subscriptions, Prisma ORM, NextAuth.js, Tailwind CSS, and deployment configs for Vercel and Cloudflare.',
    'Full-stack Next.js boilerplate ready for your SaaS product',
    9900,
    'Code Templates',
    '["nextjs","saas","boilerplate","typescript"]',
    'products/nextjs-saas-starter.zip',
    'nextjs-saas-starter.zip',
    '/covers/saas-kit.jpg',
    1,
    1
  ),
  (
    'prod_003',
    'Motion Design System',
    'motion-design-system',
    'A curated collection of 150+ premium CSS & Framer Motion animations. Includes scroll-triggered reveals, page transitions, loading states, hover effects, and micro-interactions. Framework-agnostic with React hooks and vanilla JS versions.',
    '150+ premium animations for CSS and Framer Motion',
    2900,
    'Animation Packs',
    '["animations","css","framer-motion","react"]',
    'products/motion-design-system.zip',
    'motion-design-system.zip',
    '/covers/motion.jpg',
    0,
    1
  ),
  (
    'prod_004',
    'TypeScript API Architecture Guide',
    'typescript-api-guide',
    'An in-depth 200-page PDF guide covering modern TypeScript API architecture patterns. Topics include clean architecture, CQRS, event sourcing, microservices, OpenAPI spec generation, and testing strategies. Includes 50+ code examples.',
    'In-depth guide to TypeScript API architecture patterns',
    1900,
    'eBooks',
    '["typescript","api","architecture","guide"]',
    'products/typescript-api-guide.pdf',
    'typescript-api-guide.pdf',
    '/covers/ebook.jpg',
    1,
    1
  ),
  (
    'prod_005',
    'Cloudflare Workers Crash Course',
    'cloudflare-workers-course',
    'Video course series covering everything about Cloudflare Workers, Pages, D1, R2, KV, and Durable Objects. 12 modules, 8 hours of content, all source code included. Go from zero to deploying production edge applications.',
    'Complete video course on Cloudflare Workers & edge computing',
    7900,
    'Courses',
    '["cloudflare","workers","edge","video-course"]',
    'products/cloudflare-workers-course.zip',
    'cloudflare-workers-course.zip',
    '/covers/course.jpg',
    1,
    1
  );
