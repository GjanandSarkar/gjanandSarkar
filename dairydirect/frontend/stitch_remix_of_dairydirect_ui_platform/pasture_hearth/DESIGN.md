# Design System Specification: The Artisanal Digital Estate

## 1. Overview & Creative North Star: "The Modern Pastoral"
This design system rejects the clinical coldness of traditional e-commerce. Our Creative North Star is **The Modern Pastoral**—a digital experience that feels as intentional and tactile as a hand-delivered bottle of fresh milk. 

We move beyond the "template" look by embracing **Organic Editorialism**. This means we prioritize breathing room, sophisticated tonal layering, and intentional asymmetry. We don't just display products; we curate a premium local heritage. The interface should feel like a high-end lifestyle magazine: airy, warm, and authoritative, using soft geometry to create an atmosphere of safety and farm-to-table transparency.

---

## 2. Color & Surface Philosophy
The palette is rooted in the earth, using high-chroma botanicals and creamy neutrals to establish a premium domesticity.

### The Palette (Material Design Mapping)
*   **Primary (`#3f6530`):** The Deep Meadow. Used for brand authority and primary actions.
*   **Secondary (`#8a5025`):** The Terracotta. Used for warmth and grounded secondary actions.
*   **Tertiary (`#3b644c`):** The Mint Forest. Used for accents and confirmed states.
*   **Surface (`#fafaf3`):** The Heirloom Cream. Our canvas.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. 
*   Use `surface-container-low` (`#f4f4ed`) for secondary sections sitting on a `surface` background.
*   Use `surface-container-lowest` (`#ffffff`) for cards to create a "lifted" feel against the cream background.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked fine papers. 
1.  **Base Layer:** `surface` (Cream background).
2.  **Content Zones:** `surface-container` (Subtle tonal shift).
3.  **Interactive Elements:** `surface-container-lowest` (Pure White cards) to draw the eye.

### The "Glass & Gradient" Rule
To avoid a flat "out-of-the-box" appearance, floating headers and mobile navigation should utilize **Glassmorphism**. Use a semi-transparent `surface` color with a `20px` backdrop-blur. 
*   **Signature Textures:** Apply a subtle linear gradient from `primary` (#3f6530) to `primary-container` (#577f46) on hero buttons and featured product cards to add "soul" and depth.

---

## 3. Typography: Editorial Authority
We use **Inter** not as a system font, but as a clean, architectural tool to frame our heritage content.

*   **Display (Large/Med/Small):** Bold weight. Use for hero sections. These should feel like magazine mastheads—spacious and bold.
*   **Headline (Large/Med/Small):** Semibold. For section titles. Pair with generous top-padding to let the "pasture" breathe.
*   **Title (Large/Med/Small):** Semibold. Used for product names and card titles.
*   **Body (Large/Med):** Regular weight. Optimized for readability.
*   **Labels & Prices:** Prices must always use `primary` (#3f6530) in Semibold to ensure the "value" is anchored in the brand color.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines. Depth is a result of light and shadow, not ink.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f4f4ed) section. The 1% shift in value creates a soft, natural lift that feels premium and organic.
*   **Ambient Shadows:** For floating elements (modals/mobile sheets), use an extra-diffused shadow: `0 12px 32px rgba(63, 101, 48, 0.05)`. Note the tint: we use a tiny percentage of our **Primary Green** in the shadow to mimic natural light filtered through trees.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` at **15% opacity**. Never use 100% opaque borders.
*   **Glassmorphism:** Use `surface` at 80% opacity with a `blur(12px)` for sticky headers. This allows product images to bleed through softly as the user scrolls, creating a sense of continuity.

---

## 5. Components

### Buttons
*   **Primary:** `primary` background with `on-primary` (white) text. 12px radius. Use the signature subtle gradient for hover states.
*   **Secondary:** `secondary` (Clay Brown) background. Reserved for "Add to Cart" or "Alternative" actions.
*   **Tertiary:** Ghost style. No background, `primary` text. Use for "Learn More" editorial links.

### Cards & Lists
*   **Forbid Dividers:** Do not use lines between list items. Use 16px or 24px vertical spacing to separate content.
*   **Interactive Cards:** `surface-container-lowest` (White) with a 16px radius. On hover, shift the background to `primary-fixed-dim` for a soft tactile response.

### Status Badges
*   **Active:** `primary-fixed` background / `on-primary-fixed` text.
*   **Warning:** `secondary-fixed` background / `on-secondary-fixed` text.
*   **Confirmed:** `tertiary-fixed` background / `on-tertiary-fixed` text.
*   **Note:** All badges should use 9999px (Full) rounding to contrast against the 16px cards.

### Input Fields
*   10px radius. Background should be `surface-container-high`. Labels use `label-md` in `on-surface-variant`. On focus, transition the background to `surface-container-lowest` with a 1pt `primary` ghost border (20% opacity).

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical padding in hero sections (e.g., more padding on the left than the right) to create an editorial layout.
*   **Do** use the "Milk Drop" pattern as a mask for images rather than a simple square.
*   **Do** prioritize white space. If a layout feels "crowded," double the spacing tokens.

### Don't:
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#1a1c18) to maintain the warm, organic tone.
*   **Don't** use standard "drop shadows." If it looks like a default CSS shadow, it is too heavy. It should feel like an "ambient glow."
*   **Don't** use dividers. If two elements need separating, use a background color shift or more space.