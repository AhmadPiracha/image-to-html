require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting - 10 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple in-memory cache (cleared on restart)
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCacheKey(images, style, customColor, editPrompt) {
  const imageHashes = images.map(img => img.base64.slice(0, 100)).join('|');
  return `${imageHashes}_${style}_${customColor}_${editPrompt || ''}`;
}

// Style presets - detailed instructions for better designs
const stylePrompts = {
  luxury: `Create a luxury high-fashion editorial page in vanilla HTML/CSS/JS. Import Playfair Display (700, 900) and Cormorant Garamond (300, 400, 500) from Google Fonts — use Playfair Display for all headings, Cormorant Garamond for body and captions. Background: #0a0804. Primary accent: #c9a84c (gold). Secondary: #e8d5a3 (champagne). Text: #f0ead8.

LAYOUT: Full-viewport hero with the image as the dominant focal point — minimum 60vh, object-fit: cover, generous padding (min 80px). Below: a two-column editorial section (60/40 split), product title in Playfair Display at 3.5rem with letter-spacing: 0.15em, a thin 1px gold horizontal rule after every heading, and a paragraph in Cormorant Garamond at 1.2rem / line-height 2.

BORDERS & FRAMES: Wrap key sections in a thin 1px solid #c9a84c border with 40px internal padding. Add a 4px gold top border to the page header.

EFFECTS (CSS only): Hover on the image fades in a semi-transparent overlay (#0a0804 at 40%) with a centered label in Cormorant Garamond italic. All transitions: 0.4s ease. Nav links underline from center on hover using a ::after pseudo-element. Fade-in on page load via @keyframes (opacity 0→1, translateY 20px→0, 0.8s ease).

RESPONSIVE: Stack to single column below 768px. Image stays full-width. Font sizes scale with clamp().`,

  minimal: `Create an ultra-minimal gallery-aesthetic page in vanilla HTML/CSS/JS. Import Crimson Pro (300, 400, 600) from Google Fonts — used for all text. Background: #ffffff. Body text: #1a1a1a. One accent color: derive a muted tone from the image's dominant hue (default fallback: #8a7560). No decorative elements.

LAYOUT: Centered single-column, max-width 720px, margin auto. Image displayed at full column width with 0 border-radius, no box-shadow. Title at 2.2rem / font-weight 300 / letter-spacing 0.08em. Body text at 1.05rem / line-height 1.9. All section spacing via margin-top only (no padding stacking). Navigation: 5 plain text links, 0.75rem, uppercase, letter-spacing 0.2em, no borders.

WHITESPACE: Minimum 120px vertical margin between sections. The image should have 60px margin top and bottom. No background colors on any container — everything floats on white.

EFFECTS (CSS only): Image desaturates to grayscale by default, transitions to full color on hover (filter: grayscale(1)→grayscale(0), 0.5s ease). Links change from #1a1a1a to the accent color on hover, no underline. Page fades in at load (@keyframes opacity 0→1, 0.6s).

RESPONSIVE: Already single-column. Reduce padding to 24px on mobile. Font scales with clamp(1rem, 2.5vw, 1.1rem).`,

  editorial: `Create a bold editorial magazine-style page in vanilla HTML/CSS/JS. Import Bebas Neue (400) and Source Serif 4 (300, 400, 700, italic) from Google Fonts. Background: #f2f0eb (off-white newsprint). Text: #0d0d0d. One bold accent: #e8001d (red). No other colors.

LAYOUT: Asymmetric CSS Grid — define a 12-column grid at 100vw. Hero: image spans columns 1–8, a vertical headline block spans columns 7–12, overlapping the image edge by 2 columns (negative margin or absolute positioning). Headline in Bebas Neue at clamp(4rem, 10vw, 9rem), line-height 0.9, uppercase. Body copy in Source Serif 4 at 1rem / line-height 1.7.

TYPOGRAPHIC DETAILS: Use a large red drop cap (::first-letter, float left, font-size 5rem, Bebas Neue) on the opening paragraph. A horizontal rule (2px solid #0d0d0d) separates sections. Section labels: 0.65rem uppercase, letter-spacing 0.3em, red.

EFFECTS (CSS only): On scroll, a sticky top bar (height 48px, background #0d0d0d, text white) fades in using IntersectionObserver + a CSS class toggle. Image has a slight contrast boost (filter: contrast(1.08)) and desaturates partially (grayscale(0.3)) — both via CSS. Hover on nav items shifts background to #e8001d and text to white, 0.2s.

RESPONSIVE: Collapse grid to single-column below 900px. Headline stacks above image. Drop cap retained.`,

  bold: `Create a futuristic high-contrast dark mode page in vanilla HTML/CSS/JS. Import Syne (700, 800) and Syne Mono (400) from Google Fonts. Background: #0a0a0a. Primary accent: #00fff7 (cyan). Secondary accent: #b4ff00 (lime) — used sparingly, one section only. Text: #f0f0f0.

LAYOUT: Full-viewport hero with centered image (max-width 800px, centered with auto margins), a massive headline above in Syne 800 at clamp(3.5rem, 9vw, 8rem), letter-spacing -0.02em. Below: a 3-column feature grid (CSS Grid, gap 2px), each card with a 1px solid #00fff7 border, 32px padding, background #111111.

EFFECTS (CSS only): On hover, cards get a box-shadow: 0 0 24px rgba(0,255,247,0.3) and border brightens. Image hover: add a CSS noise texture overlay (SVG data URI turbulence filter via feDisplacementMap) that activates on hover — or fallback to a cyan tinted overlay at 15% opacity. All glows via box-shadow and text-shadow, not JS. Button: solid #00fff7, text #0a0a0a, font Syne 700, uppercase — on hover, background inverts and a 0 0 32px rgba(0,255,247,0.6) glow appears. Page load: staggered fade-in on sections (animation-delay: 0.1s increments).

RESPONSIVE: Stack to single column below 768px. Font sizes via clamp(). Accent glow effects preserved.`,

  pastel: `Create a soft, warm lifestyle/wellness page in vanilla HTML/CSS/JS. Import Lora (400, 400i, 600) and DM Sans (300, 400) from Google Fonts. Background: #faf8f5 (warm off-white). Accents: #e8b4a0 (blush), #a8c5a0 (sage). Text: #3d3530. All border-radius: 16px on cards, 24px on image containers.

LAYOUT: A centered single-column hero (image top, rounded corners, max-width 640px, centered), followed by a 2-column card row (CSS Grid, 1fr 1fr, gap 24px). Cards have background #ffffff, 1px solid #e8d5cc, 24px padding, 16px border-radius. Headings in Lora 600 at 2rem. Body in DM Sans 300 at 1rem / line-height 1.8.

SHADOWS: Only soft shadows — box-shadow: 0 4px 20px rgba(0,0,0,0.06). No hard shadows.

EFFECTS (CSS only): On page load, elements fade up via @keyframes (opacity 0→1, translateY 16px→0) with staggered animation-delay (0.15s, 0.3s, 0.45s). Image on hover: subtle scale(1.02) with overflow hidden on parent. Cards on hover: lift with box-shadow: 0 8px 32px rgba(0,0,0,0.1), transition 0.35s ease. Button: background #e8b4a0, text white, no border, hover darkens to #d4907a.

RESPONSIVE: Collapse to single column below 640px. Spacing reduces by ~30% via clamp().`,

  retro: `Create a 70s-inspired warm retro page in vanilla HTML/CSS/JS. Import Abril Fatface (400) and Karla (400, 700) from Google Fonts. Background: #f5e6c8 (warm parchment). Palette: #c45e1a (burnt orange), #8b3a00 (dark brown), #e8a030 (amber), #f5e6c8. Text: #2e1a0e.

LAYOUT: A full-width hero banner (background #c45e1a, image inset with a white Polaroid-style frame: 12px white border, 32px bottom padding, slight rotate(-2deg)), below a 3-column grid of content cards. Headline in Abril Fatface at clamp(3rem, 7vw, 6rem), color #f5e6c8. Cards use Karla 400 for body, bold section labels in uppercase Karla 700 at 0.75rem / letter-spacing 0.25em.

TEXTURE: Apply a grain overlay across the full page using a CSS-only approach: a pseudo-element (::before on body, position: fixed, inset 0, z-index 9999, pointer-events: none) with an SVG noise filter (feTurbulence baseFrequency="0.65", stitchTiles="stitch") at 8% opacity.

DECORATIVE DETAILS: A thick 4px double border (#c45e1a) around section headings. Starburst/sunburst CSS shape (clip-path polygon) as a decorative badge. Wavy horizontal rule using CSS border-radius trick or SVG inline.

EFFECTS (CSS only): Image frame has a subtle rotate(-2deg) — parent div, overflow hidden. Cards brighten background on hover (background: #fdefd0, transition 0.3s). No animations on load — keep it static and print-like.

RESPONSIVE: Stack to single column below 768px. Image frame stays but rotation reduces to rotate(-1deg). Font sizes via clamp().`,

  ecommerce: `Create a modern e-commerce product page in vanilla HTML/CSS/JS. Import Plus Jakarta Sans (400, 500, 700, 800) from Google Fonts. Background: #ffffff. Text: #111111. Accent: #111111 (primary CTA) / #f5f5f5 (secondary surfaces). Price highlight: #c0392b.

LAYOUT: Two-column CSS Grid (55/45 split) — left: product image (full height, object-fit: contain, background #f9f9f9, padding 40px); right: product details. Product title: 2.2rem / font-weight 700. Price: 2rem / font-weight 800 / color #c0392b. A 1px #e5e5e5 rule separates price from description. Description: 0.95rem / line-height 1.8 / color #444.

CTA: "Add to Cart" button — full width, height 56px, background #111111, text white, font-weight 700, font-size 1rem, uppercase, letter-spacing 0.1em, border-radius 4px. On hover: background #333333, box-shadow: 0 4px 20px rgba(0,0,0,0.2). Secondary button ("Save to Wishlist") — white background, 1px solid #111111, same sizing.

TRUST BADGES: A 3-item icon row (SVG inline icons) for "Free shipping", "30-day returns", "Secure checkout" — 0.8rem text, #666, centered below the CTA.

FEATURE BULLETS: 4–5 items with a ✓ checkmark (color #111111) and 0.95rem body text.

EFFECTS (CSS only): Image subtle zoom on hover (scale 1.03, transition 0.4s, overflow hidden). CTA button has a press effect (scale 0.98 on :active). Quantity selector: plain number input with +/− buttons styled as square icon buttons.

RESPONSIVE: Stack to single column below 860px. Image becomes 100vw. Sticky "Add to Cart" bar appears below 600px (position: fixed, bottom 0).`,

  portfolio: `Create an award-winning creative portfolio page in vanilla HTML/CSS/JS. Import Inter (300, 400, 600, 800) and Space Grotesk (500, 700) from Google Fonts. Background: #0c0c0c. Text: #f0f0f0. Accent: derive from image or use #6366f1 (indigo).

LAYOUT: Asymmetric Bento-grid mixing large hero image with smaller project cards. HEADER: Minimal sticky nav with name/logo left, "Work / About / Contact" links right, circular "Available for work" badge with pulse animation.

HERO: Full-width featured project with the uploaded image, project title in Space Grotesk 700 at clamp(3rem, 8vw, 7rem), overlaid with blend-mode, subtle Ken Burns zoom on hover, "View Project →" link.

PROJECTS GRID: 2-3 additional project cards with grayscale-to-color hover effect, category tags, year labels. Cards: background #141414, 1px solid rgba(255,255,255,0.08), 24px padding.

ABOUT SECTION: Brief bio with large pull quote in Inter 300 italic at 1.5rem. Skills tags with subtle borders.

FOOTER: Email link with magnetic hover effect, social icons (behance, dribbble, linkedin style).

EFFECTS (CSS only): Smooth 60fps transitions (transform, opacity). Scroll-triggered fade-ins via IntersectionObserver. Noise texture overlay (::before pseudo-element with SVG turbulence filter, 5% opacity). Hover states: scale(1.02), filter brightness(1.1).

RESPONSIVE: Stack to single column below 768px. Font sizes via clamp(). Keep dark theme and effects.`,

  landing: `Create a high-converting landing page in vanilla HTML/CSS/JS. Import Fraunces (700, 900, italic) and Outfit (300, 400, 600) from Google Fonts. Background: #0f0f13 (near-black). Text: #f0eff4. Gradient accent: linear-gradient(135deg, #7c3aed, #2563eb) — used for CTAs and highlights only.

SECTIONS (in order):
1. HERO: Full-viewport. Image right (40% width, absolute positioned, right: 0, clipped to viewport edge), text left. Headline in Fraunces 900 italic at clamp(3rem, 6vw, 5.5rem), subheadline in Outfit 300 at 1.2rem / #aaa, primary CTA button (gradient background, white text, 56px height, 24px padding, border-radius 8px).
2. SOCIAL PROOF: 5 logo placeholders (gray SVG boxes, grayscale filter), single row, centered, 80% opacity. Label: "Trusted by teams at..." in Outfit 300 / 0.8rem / #666.
3. FEATURES: 3-column grid. Each card: background #1a1a24, 1px solid #2a2a38, 32px padding, 12px border-radius. Icon (SVG, 28px, gradient fill), heading Outfit 600 / 1.1rem, body Outfit 300 / 0.95rem / #aaa.
4. TESTIMONIAL: Full-width dark card (#1a1a24), quote in Fraunces 400 italic / 1.5rem, attributed name and role in Outfit 400 / 0.9rem / #888.
5. FINAL CTA: Centered, large headline, same gradient CTA button.

EFFECTS (CSS only): CTA button hover: brightness(1.15) + box-shadow: 0 8px 32px rgba(124,58,237,0.4). Feature cards lift on hover (translateY(-4px), box-shadow increase, transition 0.3s). IntersectionObserver adds .visible class to sections; .visible triggers @keyframes fade-up (opacity 0→1, translateY 24px→0).

RESPONSIVE: Stack all sections to single column below 768px. Hero image moves above text. Font sizes via clamp().`,

  startup: `Create a modern B2B tech startup landing page in vanilla HTML/CSS/JS. Import Plus Jakarta Sans (300, 400, 600, 800) from Google Fonts — used for all text. Background: #06060a. Text: #f2f2f7. Gradient: linear-gradient(135deg, #6d28d9 0%, #1d4ed8 60%, #0ea5e9 100%). Secondary surface: rgba(255,255,255,0.04) with backdrop-filter: blur(12px) (glassmorphism cards).

SECTIONS:
1. HERO: Full-viewport. Large headline Plus Jakarta Sans 800 at clamp(2.8rem, 6vw, 5rem), letter-spacing -0.03em. Subtext Plus Jakarta Sans 300 at 1.15rem / #94949f. Gradient CTA button (border-radius 10px, height 52px, padding 0 32px). Image/mockup below headline, max-width 900px, centered, slight drop shadow.
2. METRICS ROW: 4 counters (e.g. "10k+ Users", "99.9% Uptime") — each in a glassmorphism card. Number: 2.5rem / 800 weight / gradient text (background-clip: text). Label: 0.85rem / #888.
3. FEATURES ALTERNATING: 2 alternating sections (image left/text right, then text left/image right), each section 100vw, padding 100px 0. Light section (#0f0f17 background), dark section (#06060a). Image gets a subtle border: 1px solid rgba(255,255,255,0.08).
4. TESTIMONIALS: 3 cards in a grid, glassmorphism style. Avatar circle (gradient background initial placeholder), name, company, quote in 0.95rem italic.
5. FOOTER: One-line nav, gradient email CTA link.

EFFECTS (CSS only): Glassmorphism: background rgba(255,255,255,0.04), backdrop-filter blur(12px), border 1px solid rgba(255,255,255,0.08). Hero has a radial gradient glow (position absolute, 800px circle, purple at 10% opacity, centered behind headline). CTA button: hover → brightness(1.1), box-shadow with gradient color at 40% opacity. Metric cards: hover lifts (translateY -4px, 0.3s ease). Sections fade in on scroll via IntersectionObserver.

RESPONSIVE: Single column below 900px. Alternating sections stack vertically. Glassmorphism cards stack to 1 column. Font via clamp().`,
};

// Proxy endpoint — keeps your API key safe on the server
app.post('/api/generate', apiLimiter, async (req, res) => {
  const { images, style, customColor, editPrompt } = req.body;

  // Validation
  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'At least one image is required' });
  }
  if (images.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 images allowed' });
  }
  for (const img of images) {
    if (!img.base64 || !img.mime) {
      return res.status(400).json({ error: 'Invalid image data' });
    }
    // Normalize mime type
    img.mime = img.mime.toLowerCase().trim();
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(img.mime)) {
      return res.status(400).json({ error: `Unsupported image type: ${img.mime}. Use JPEG, PNG, WebP, or GIF.` });
    }
    // Clean base64 - remove any whitespace or line breaks
    img.base64 = img.base64.replace(/\s/g, '');
    // ~10MB limit per image in base64
    if (img.base64.length > 14_000_000) {
      return res.status(400).json({ error: 'Image too large. Maximum 10MB per image.' });
    }
  }

  // Check cache
  const cacheKey = getCacheKey(images, style, customColor, editPrompt);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ html: cached.html, cached: true });
  }

  // Build image placeholders and content array
  const imageContent = images.map((img, i) => ({
    type: 'image_url',
    image_url: { 
      url: `data:${img.mime};base64,${img.base64}`
    }
  }));

  const imagePlaceholders = images.map((_, i) => `{{IMAGE_${i}_DATA_URL}}`).join(', ');
  
  let styleDirection = stylePrompts[style] || stylePrompts.luxury;
  if (customColor) {
    styleDirection += ` Use ${customColor} as the primary accent color.`;
  }

  let promptText = `You are an expert front-end developer and UI/UX designer. Create a stunning, production-ready, single-file HTML webpage featuring the uploaded image(s) as the centerpiece.

DESIGN STYLE: ${styleDirection}

CRITICAL REQUIREMENTS:

1. HTML STRUCTURE:
   - Valid HTML5 with proper doctype, lang attribute, meta viewport
   - Semantic elements: <header>, <main>, <section>, <footer>, <nav>
   - Proper heading hierarchy (h1 → h2 → h3, never skip levels)
   - Accessible: alt text, ARIA labels where needed, focus states

2. IMAGE HANDLING:
   - Use EXACTLY these placeholders for image src: ${imagePlaceholders}
   - Images must be prominently displayed as the hero/focal point
   - Use object-fit: cover and proper aspect ratios
   - Add loading="lazy" for any below-fold images

3. CSS REQUIREMENTS:
   - All CSS must be inlined in a <style> tag in the head
   - Use CSS custom properties (variables) for colors, spacing, fonts
   - Mobile-first responsive design with proper breakpoints (@media min-width: 768px, 1024px)
   - Smooth transitions (0.2-0.3s) on interactive elements
   - Subtle entrance animations using @keyframes (fade-in, slide-up)
   - Consistent spacing system (8px base unit: 8, 16, 24, 32, 48, 64px)
   - Professional typography: proper line-height (1.5-1.7 for body), letter-spacing
   - Box-sizing: border-box on all elements

4. LAYOUT REQUIREMENTS:
   - Fixed/sticky header navigation with logo and 3-4 nav links
   - Hero section: full-width or large image with overlay text if appropriate
   - At least 2 content sections below hero (features, about, gallery, testimonials, etc.)
   - Footer with links, copyright, social icons
   - Max-width container (1200px) with proper padding
   - Proper visual rhythm and whitespace

5. CONTENT:
   - Write realistic, contextual placeholder text based on what you see in the image
   - Professional copywriting style appropriate to the design
   - Real-sounding brand name (not "Brand" or "Company")
   - Meaningful navigation labels
   - Include call-to-action buttons where appropriate

6. INTERACTIVITY:
   - Smooth hover effects on buttons, links, cards
   - Focus states for accessibility (:focus-visible)
   - Optional: smooth scroll behavior, simple vanilla JS interactions
   - Mobile hamburger menu (CSS-only or minimal JS)

7. QUALITY CHECKLIST:
   ✓ No horizontal scroll on mobile
   ✓ Readable font sizes (min 16px body)
   ✓ Sufficient color contrast (4.5:1 for text)
   ✓ Touch-friendly tap targets (min 44x44px)
   ✓ Consistent design language throughout
   ✓ Professional, polished appearance`;

  if (editPrompt) {
    promptText += `\n\nUSER'S ADDITIONAL REQUESTS: ${editPrompt}`;
  }

  promptText += `

OUTPUT: Return ONLY the complete HTML file. No markdown fences, no explanations, no comments about what you created. Start directly with <!DOCTYPE html>.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            ...imageContent
          ]
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', JSON.stringify(data, null, 2));
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    let html = data.choices[0]?.message?.content || '';
    
    // Clean up any markdown fences or preamble
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    
    // Ensure it starts with DOCTYPE
    if (!html.toLowerCase().startsWith('<!doctype')) {
      const doctypeIndex = html.toLowerCase().indexOf('<!doctype');
      if (doctypeIndex > 0) {
        html = html.slice(doctypeIndex);
      }
    }
    
    // Replace all image placeholders
    images.forEach((img, i) => {
      html = html.replace(new RegExp(`\\{\\{IMAGE_${i}_DATA_URL\\}\\}`, 'g'), `data:${img.mime};base64,${img.base64}`);
    });
    // Fallback for single image old format
    if (images.length === 1) {
      html = html.replace(/\{\{IMAGE_DATA_URL\}\}/g, `data:${images[0].mime};base64,${images[0].base64}`);
    }
    
    // Validate HTML has required structure
    const hasDoctype = html.toLowerCase().includes('<!doctype html');
    const hasHtmlTag = html.toLowerCase().includes('<html');
    const hasHead = html.toLowerCase().includes('<head');
    const hasBody = html.toLowerCase().includes('<body');
    
    if (!hasDoctype || !hasHtmlTag || !hasHead || !hasBody) {
      console.warn('Generated HTML may be incomplete:', { hasDoctype, hasHtmlTag, hasHead, hasBody });
    }

    // Cache the result
    cache.set(cacheKey, { html, time: Date.now() });

    // Estimate cost (gpt-4o pricing: $5/1M input, $15/1M output)
    const inputTokens = Math.ceil(promptText.length / 4) + (images.length * 1000);
    const outputTokens = Math.ceil(html.length / 4);
    const estimatedCost = ((inputTokens * 5) + (outputTokens * 15)) / 1_000_000;

    res.json({ html, estimatedCost: estimatedCost.toFixed(4) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
