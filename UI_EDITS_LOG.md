# UI Edits Log

This document tracks all user interface edits requested across the application, documenting the affected component/file location, page URL, the original feedback, the precise implementation summary (single line), and current status.

---

### Edit #1
- **Location:** `src/app/admin/page.tsx` (`<AdminLayout> <AdminDashboard> button "7d"`)
- **Page URL:** `/admin`
- **Feedback:** In this particular box or in particular this filter, the text inside it is greyish and it is not having the contrast with the background. So we make it aware of the background so it changes color as per it.
- **What was done:** Rebuilt the period filter buttons with background-aware contrast, high-contrast active states, and dark/light mode hover styling.
- **State:** Completed

---

### Edit #2
- **Location:** `src/app/admin/page.tsx` (`<AdminLayout> <AdminDashboard> flex items`)
- **Page URL:** `/admin`
- **Feedback:** Remove this line. You don't need that. (Leaf icon + "Admin Dashboard" sub-heading above greeting).
- **What was done:** Removed the redundant "Admin Dashboard" leaf icon badge line above the main dashboard greeting.
- **State:** Completed

---

### Edit #3
- **Location:** `src/app/admin/page.tsx` (`<AdminLayout> <AdminDashboard> h1`)
- **Page URL:** `/admin`
- **Feedback:** Make this aware of the time and also after good afternoon username give on your dashboard.
- **What was done:** Updated dashboard greeting to be dynamically time-aware (morning, afternoon, evening, night) and appended "— on your dashboard".
- **State:** Completed

---

### Edit #4
- **Location:** `src/components/shared/Sidebar.tsx` (`<AdminLayout> <AdminSidebar> <Sidebar>`)
- **Page URL:** `/admin` (Global Sidebar)
- **Feedback:** This box should be moved bottom and inside this when the user clicks on it, it should have three dots at the right side of it and let user make it clickable. So when user clicks on it, there is a drop down or a drawer comes which says theme change or logout.
- **What was done:** Moved user profile box to sidebar bottom, added 3-dots trigger, and implemented an animated upward dropdown with theme toggle and logout.
- **State:** Completed

---

### Edit #5
- **Location:** `src/components/admin/AdminSidebar.tsx` & `src/components/shared/Sidebar.tsx`
- **Page URL:** `/admin` (Global Sidebar)
- **Feedback:** In this sidebar, arrange all options as per their hierarchy and keep styling similar in a systematic way. Add progressive blur on overflow at top/bottom when scrolling, and remove blur when not scrollable.
- **What was done:** Reorganized admin sidebar options into a domain hierarchy (Overview, Operations, Catalog, Sellers, Growth, System) and implemented dynamic progressive scroll blurs.
- **State:** Completed

---

### Edit #6
- **Location:** `src/app/admin/page.tsx` (`Quick Actions`)
- **Page URL:** `/admin`
- **Feedback:** The quick action is very good. Make it a little bit small in the width. And inside buttons give a small or matching border so they pop out from the container like true buttons.
- **What was done:** Reduced Quick Actions width using a 12-column grid (`lg:col-span-4`) and added tone-matched borders and hover elevation to all action buttons.
- **State:** Completed

---

### Edit #7
- **Location:** `src/app/admin/page.tsx` (`Header actions toolbar`)
- **Page URL:** `/admin`
- **Feedback:** Bring refresh to the left side, filter in between, and full report on the right. Add custom filter capability with custom date picker dropdown matching the app theme.
- **What was done:** Reordered toolbar to Refresh -> Filter with Custom Date Range Popover -> Full Reports, with themed date inputs.
- **State:** Completed

---

### Edit #8
- **Location:** `src/app/admin/page.tsx` (`Recent Trends`)
- **Page URL:** `/admin`
- **Feedback:** Explain what Recent Trends is doing, and provide multiple switchable charts with toggle buttons on top of the card to swap in between.
- **What was done:** Added chart switcher buttons (Revenue, Orders, Avg Order Value) with dedicated tooltips and an interactive info toggle explaining the tracked metrics.
- **State:** Completed

---

### Edit #9
- **Location:** `src/components/admin/AdminTable.tsx` & across admin pages
- **Page URL:** `/admin` & all admin tables
- **Feedback:** Standardize the table into a reusable component/template for use everywhere tables are required with perfect styling, hover effects, and states.
- **What was done:** Created reusable `AdminTable` component with standardized headers, row hover states, and empty states, and migrated pages to use it.
- **State:** Completed

---

### Edit #10
- **Location:** `src/components/shared/Sidebar.tsx`
- **Page URL:** `/admin` (Global Sidebar)
- **Feedback:** Follow Edit 4 for the bottom buttons (theme and logout).
- **What was done:** Removed separate bottom footer buttons and integrated them into the unified user profile popover dropdown.
- **State:** Completed

---

### Edit #11
- **Location:** `src/app/admin/layout.tsx`, `src/components/admin/AdminHeader.tsx`, & Admin Pages
- **Page URL:** `/admin/*`
- **Feedback:** Background color of every page should be grayish distinct from white card surfaces. Standardize navbars across all admin pages to match Categories/Products navbar. Ensure all tables are solid unified tables rather than loose rows with space between them.
- **What was done:** Applied grayish page background (`bg-[#f4f6f2]`), created reusable `AdminHeader`, and converted loose card-row lists (e.g. Customers) into solid cohesive tables.
- **State:** Completed

---

### Edit #12
- **Location:** `src/components/shared/Sidebar.tsx` (`.flex > .hidden > .p-3`)
- **Page URL:** `/admin/*` (Sidebar Bottom Card)
- **Feedback:** Remove the back box and keep the inside card as it is with a blur and frost and glass effect.
- **What was done:** Removed outer wrapper back box and styled the profile card & upward popup drawer with frosted glass blur (`backdrop-blur-md/xl bg-white/75... border-white/80 dark:border-white/10`).
- **State:** Completed

---

### Edit #13
- **Location:** `src/components/shared/Sidebar.tsx` (`.flex > .hidden > .relative > .flex-1`)
- **Page URL:** `/admin/*` (Sidebar Nav List)
- **Feedback:** In this remove the progressive blur effect.
- **What was done:** Removed top and bottom progressive blur gradient masks and dynamic scroll event listeners from the navigation list.
- **State:** Completed

---

### Edit #14
- **Location:** `src/components/shared/Sidebar.tsx` & `src/components/admin/AdminSidebar.tsx`
- **Page URL:** `/admin/*` (Sidebar Sections)
- **Feedback:** This all divisions you made give lines divisions also so easy to understand.
- **What was done:** Added subtle horizontal line dividers (`h-px bg-border/60 mx-1 mb-2.5`) between all sidebar functional section groupings.
- **State:** Completed

---

### Edit #15
- **Location:** `src/app/admin/layout.tsx` & all admin page roots
- **Page URL:** `/admin/*`
- **Feedback:** In the all page background should be like http://localhost:3000/admin/analytics page #F5F6F5.
- **What was done:** Applied uniform `#F5F6F5` background across `AdminLayout` and individual admin page root containers.
- **State:** Completed

---

### Edit #16
- **Location:** `src/components/admin/AdminHeader.tsx` & all admin pages
- **Page URL:** `/admin/*`
- **Feedback:** Bring matching/standard navbar on all admin pages from Categories and Products without back button or different layouts.
- **What was done:** Standardized navbar layout across all admin pages to Categories & Products standard via `AdminHeader` (Title + Subtitle left, Refresh + Actions right, no back button).
- **State:** Completed

---

### Edit #17
- **Location:** Across all admin pages with tabular data
- **Page URL:** `/admin/*`
- **Feedback:** Wherever the table is there, print the table which I told you (standard AdminTable component everywhere without row gaps).
- **What was done:** Standardized tabular records across admin pages into cohesive `AdminTable` layouts with themed headers and row hover effects (replacing disconnected floating row cards).
- **State:** Completed

---

### Edit #18
- **Location:** `src/components/shared/Sidebar.tsx` (`.flex > .hidden > .p-3 > .w-full`)
- **Page URL:** `/admin/*` (Sidebar Footer Profile)
- **Feedback:** Bottom admin user button should be a floating button in the sidebar with no background container behind it, a blur behind it to differentiate from background, and the sidebar nav should scroll continuously behind it with adequate bottom padding so items aren't trapped.
- **What was done:** Converted user profile trigger into an absolute floating frosted-glass card (`absolute bottom-3 left-3 right-3 z-30 backdrop-blur-xl bg-surface/75 border border-border/80 shadow-lg`), removed enclosing background container, and extended nav scroll list with `pb-24` clearance padding so content scrolls smoothly underneath.
- **State:** Completed

---

### Edit #19
- **Location:** `src/components/shared/Sidebar.tsx` (`.flex > .hidden > .h-18`)
- **Page URL:** `/admin/*` (Sidebar Brand Header)
- **Feedback:** In the sidebar header right side, add easily clickable backward and forward navigation buttons that execute browser history back and forth on every page.
- **What was done:** Added browser history navigation buttons (`ChevronLeft` and `ChevronRight`) in the sidebar brand header beside the logo/title wired to `window.history.back()` and `window.history.forward()`.
- **State:** Completed

---

### Edit #20
- **Location:** `src/app/admin/products/approvals/page.tsx`
- **Page URL:** `/admin/products/approvals`
- **Feedback:** Replace bulky card buttons with compact metric cards, add standard search/filter bar, and add Table View & Grid View toggle with Table View as the default.
- **What was done:** Redesigned bulky card buttons into compact summary metric cards with semantic borders, added standard `h-10` search and `h-8` status filters, and introduced Table View (`AdminTable`) as default alongside Grid View toggle.
- **State:** Completed

---

### Edit #21
- **Location:** `src/app/admin/products/page.tsx`
- **Page URL:** `/admin/products`
- **Feedback:** Truncate table product descriptions with ellipsis rather than multiline breaks, widen category column so pills don't break, ensure text-aware contrast on all pills, and make filter pills compact in height and consistent.
- **What was done:** Truncated long product descriptions with ellipsis (`truncate max-w-[280px]`), widened category column (`whitespace-nowrap min-w-[150px]`) with text-aware contrast pills, and standardized category filter pills to compact `h-8` height.
- **State:** Completed

---

### Edit #22
- **Location:** `src/app/admin/sellers/page.tsx`
- **Page URL:** `/admin/sellers`
- **Feedback:** In the sellers module, ensure action buttons and status pills have proper semantic contrast and color roles (avoid clashing red text against green backgrounds).
- **What was done:** Eliminated clashing red-on-green styling across permanently banned/deactivated cards, badges, and action buttons (`bg-red-600 text-white` for actions; `bg-red-100 text-red-900 border-red-300` for badges), replaced green list item highlight with neutral styling, and standardized search/filter heights.
- **State:** Completed

---

### Edit #23
- **Location:** `src/app/admin/vendor-inquiries/page.tsx`
- **Page URL:** `/admin/vendor-inquiries`
- **Feedback:** Vendor inquiry page should also have the standard table format with search/filter bar; clicking a row opens the full user info drawer/modal with action buttons.
- **What was done:** Replaced split 2-column layout with unified `AdminTable` displaying applicant details, category badges, location, tax info, and dates; row clicks open an interactive slide-over review modal with compliance docs, remarks, and approval/rejection actions.
- **State:** Completed

---

### Edit #24
- **Location:** Across all admin listing pages (`/admin/*`)
- **Page URL:** `/admin/*`
- **Feedback:** Make the search bar and filter controls crisp, clearly visible, and consistent in height, borders, and layout across all admin pages.
- **What was done:** Standardized search inputs (`h-10`, rounded-xl, crisp border) and filter pills (`h-8`, rounded-full) across all admin pages for a unified, consistent design system.
- **State:** Completed

---

### Edit #25
- **Location:** `src/app/seller/layout.tsx`
- **Page URL:** `/seller/*`
- **Feedback:** Seller dashboard background should be `#F5F6F5` matching Admin canvas background.
- **What was done:** Applied global background canvas `#F5F6F5` (`bg-[#F5F6F5] dark:bg-[#121614]`) matching Admin dashboard standards.
- **State:** Completed

---

### Edit #26
- **Location:** `src/components/seller/SellerSidebar.tsx`
- **Page URL:** `/seller/*` (Seller Sidebar)
- **Feedback:** Adapt Admin sidebar hierarchy with grouped line divisions, floating frosted user profile button at bottom with theme switch/logout, and history back/forward buttons in header.
- **What was done:** Reorganized sidebar into structured sections with line divisions, added browser back & forward header buttons, and implemented the floating frosted-glass profile card with scroll clearance.
- **State:** Completed

---

### Edit #27
- **Location:** `src/app/seller/dashboard/page.tsx`
- **Page URL:** `/seller/dashboard`
- **Feedback:** Match standard AdminHeader layout, add Table View as default for products with Grid View toggle, and standardize search `h-10` and filter pills `h-8`.
- **What was done:** Replaced custom header with `AdminHeader`, introduced `AdminTable` as default product catalog view alongside a Grid View toggle, and standardized filter pills (`h-8`) and search (`h-10`).
- **State:** Completed

---

### Edit #28
- **Location:** `src/app/seller/orders/page.tsx` & `src/components/seller/SellerOrdersManager.tsx`
- **Page URL:** `/seller/orders`
- **Feedback:** Match AdminHeader component and unify orders listing using the standard AdminTable format.
- **What was done:** Upgraded orders page with `AdminHeader`, standardized search input (`h-10`) and filter pills (`h-8`), and unified order status indicators.
- **State:** Completed

---

### Edit #29
- **Location:** `src/app/seller/returns/page.tsx` & `src/components/seller/SellerReturnsManager.tsx`
- **Page URL:** `/seller/returns`
- **Feedback:** Match AdminHeader component and unify returns/claims using standard AdminTable format.
- **What was done:** Integrated `AdminHeader` and converted return/replacement claim rows into the cohesive `AdminTable` template with high-contrast status pills.
- **State:** Completed

---

### Edit #30
- **Location:** `src/app/globals.css`
- **Page URL:** Global / All Pages
- **Feedback:** In dark mode, remove the green shade in the background. Keep it completely black. Only keep the accent color in green. Don't make backgrounds or boxes in green shades (looks like terminal/gaming vibes). Fix Tailwind dark variant selector so system dark preference doesn't corrupt light mode.
- **What was done:** Added `@custom-variant dark (&:where(.dark, .dark *));`, configured dark mode CSS variables to pure pitch-black (`#000000`), neutral dark zinc surfaces (`#0a0a0a`, `#121212`, `#18181b`), and neutral borders (`#27272a`), strictly isolating vibrant green (`#22c55e`) to interactive action accents.
- **State:** Completed

---

### Edit #31
- **Location:** `src/app/admin/layout.tsx`, `src/app/seller/layout.tsx`, `src/app/admin/page.tsx`
- **Page URL:** `/admin/*`, `/seller/*`
- **Feedback:** Fix broken layout contrast where inline styles forced light grey `#F5F6F5` canvas in dark mode while cards were dark.
- **What was done:** Removed hardcoded inline styles and undefined CSS variables; applied unified Tailwind canvas classes `bg-[#F5F6F5] dark:bg-black text-foreground` across both admin and seller layout wrappers and dashboard cards.
- **State:** Completed

---

### Edit #32
- **Location:** `src/components/shared/Sidebar.tsx`, `src/components/seller/SellerSidebar.tsx`
- **Page URL:** `/admin/*`, `/seller/*` (Sidebar Footer Profile)
- **Feedback:** Bottom user information button must be in white color only in light mode (an elevated shade of white with clean contrast against the sidebar), not dark grey.
- **What was done:** Redesigned floating user profile trigger card to crisp pure white (`bg-white dark:bg-[#121212]`) with subtle border (`border-zinc-200/90 dark:border-zinc-800`), elevation shadow (`shadow-[0_4px_16px_rgba(0,0,0,0.06)]`), and matching white menu popover.
- **State:** Completed

---

### Edit #33
- **Location:** `src/components/admin/AdminHeader.tsx`, `src/app/seller/returns/page.tsx`, and across admin/seller pages
- **Page URL:** `/admin/*`, `/seller/*`
- **Feedback:** Standardize the navbar on all admin and seller pages to match the Admin homepage navbar: Left side has heading and subheading; right side has refresh, middle filters, and primary accent button. Remove hardcoded green borders.
- **What was done:** Rebuilt `AdminHeader` to match homepage navbar typography (`text-[24px] md:text-[26px] tracking-tight`), refresh trigger (`p-2.5 rounded-[12px] border border-border bg-surface`), and primary accent action button, deploying it across all admin and seller sub-pages.
- **State:** Completed

---

### Edit #34
- **Location:** Across all Admin & Seller listing pages (`products`, `approvals`, `sellers`, `inventory`, `returns`, `vendor-inquiries`, `categories`, `seller/dashboard`, `seller/orders`, `seller/returns`)
- **Page URL:** `/admin/*`, `/seller/*`
- **Feedback:** Search bars and filters must be constant and unified: identical sizes (`h-10` search, `h-8` pills), identical crisp borders, same animations, and clean placement across all pages.
- **What was done:** Standardized all search inputs to `h-10` with rounded-xl corners, clear buttons, and crisp focus rings, standardized all filter pill groups to `h-8` with rounded-full pill buttons and active primary highlights, and provided default table views with grid view toggles.
- **State:** Completed

---

### Edit #35
- **Location:** `src/components/shared/Sidebar.tsx`, `src/components/seller/SellerSidebar.tsx`, `src/app/admin/layout.tsx`, `src/app/seller/layout.tsx`, `src/app/seller/dashboard/page.tsx`, `src/app/admin/analytics/page.tsx`, `src/app/admin/returns/page.tsx`
- **Page URL:** `/admin/*`, `/seller/*`
- **Feedback:** The UI layout is broken. The pages have space in between and the sidebar is also being scrolled with the page content.
- **What was done:** Removed conflicting `relative` class from both sidebars to permanently pin them to the viewport (`fixed top-0 left-0 h-screen w-[260px]`), and removed artificial `max-w-[1400px] mx-auto` containers across admin and seller layouts to eliminate the giant blank gap between the sidebar and main content.
- **State:** Completed


---

### Edit #36
- **Location:** `src/app/admin/products/page.tsx`
- **Page URL:** `/admin/products`
- **Feedback:** Search bar and filter bar are not consistent with other pages; items are underflowing/overflowing; add progressive blur on overflow so user knows horizontal scroll is possible, and organize filters into clean dropdowns with high visual hierarchy.
- **What was done:** Added progressive horizontal scroll blur indicators (`bg-gradient-to-r/l`) for category filter pills; rebuilt search and filters using standard `AdminToolbar` card with clear search button, status dropdown, sort dropdown, and table/grid view toggle.
- **State:** Completed

---

### Edit #37
- **Location:** `src/app/admin/products/approvals/page.tsx`
- **Page URL:** `/admin/products/approvals`
- **Feedback:** In the product approval page, the search bar is not correct and not consistent.
- **What was done:** Replaced custom controls with standard `AdminToolbar` containing status count pills (`Pending`, `Approved`, `Rejected`, `Suspended`, `All`), search with clear button, and table/grid view switcher.
- **State:** Completed

---

### Edit #38
- **Location:** `src/app/admin/quality-reports/page.tsx`
- **Page URL:** `/admin/quality-reports`
- **Feedback:** In admin quality reports, search bar and filters are not consistent.
- **What was done:** Standardized the header actions and replaced custom controls with standard `AdminToolbar` above the reports table featuring status pills (`Pending Review`, `Approved`, `Rejected`, `All Reports`) and standard search input.
- **State:** Completed

---

### Edit #39
- **Location:** `src/app/seller/dashboard/page.tsx`, `src/app/seller/orders/page.tsx`, and `src/components/seller/SellerOrdersManager.tsx`
- **Page URL:** `/seller/dashboard`, `/seller/orders`
- **Feedback:** Remove redundant sub-tabs bar (`Overview | Products | Orders | ...`) from seller dashboard because the sidebar handles it; convert the seller orders listing into the consistent `AdminTable` template.
- **What was done:** Removed redundant in-page sub-tabs bar from seller dashboard; upgraded `SellerOrdersManager` to standard `AdminTable` with columns `Order & Customer`, `Date & Time`, `Items & Total`, `Payment`, `Fulfillment Status`, and `Actions`, preserving expandable order lifecycle and COD management workflows.
- **State:** Completed

---

### Edit #40
- **Location:** `src/components/admin/AdminMobileNav.tsx`, `src/components/shared/Sidebar.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/components/seller/SellerSidebar.tsx`, `src/app/admin/layout.tsx`, `src/app/seller/layout.tsx`, `src/components/admin/AdminTable.tsx`, `src/components/admin/ConfirmCodPaymentModal.tsx`, `src/components/seller/SellerOrdersManager.tsx`
- **Page URL:** `/admin/*`, `/seller/*` (Mobile Responsiveness)
- **Feedback:** Make admin and seller portals responsive for mobile devices:
  1. Floating square-corner rounded bar at top with margins (not touching screen edges), frosted blur, semi-transparent background.
  2. Left icon button to open sidebar drawer sliding in from left to right over all content.
  3. Center displays left-aligned current screen/page name.
  4. Right shows clickable user avatar that also opens the sidebar drawer.
  5. Mobile sidebar drawer is fully scrollable and includes Theme toggle and Logout at the bottom matching desktop.
  6. Horizontal swipeable tables with progressive edge blur indicator so user sees when table overflows horizontally.
  7. Slide-up bottom-sheet drawers with grab handle and thumb-friendly action buttons for dialogs and modals.
- **What was done:** Created `AdminMobileNav.tsx` with floating frosted top pill (`mx-3.5 my-2.5 rounded-2xl bg-surface/85 backdrop-blur-md border border-border/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)]`), dynamic route title, left drawer trigger button, and clickable user avatar. Added slide-in mobile drawers to `Sidebar.tsx` and `SellerSidebar.tsx` with backdrop overlay, auto-closing on navigation, and bottom user card with theme toggle and logout. Added horizontal swipeable scrolling with progressive left/right edge blur indicators (`canScrollLeft`, `canScrollRight`) to `AdminTable.tsx`. Upgraded dialogs and modals to responsive slide-up bottom sheets with grab handles.
- **State:** Completed

---

### Edit #41
- **Location:** `src/components/admin/AdminMobileNav.tsx`, `src/components/admin/AdminHeader.tsx`, `src/components/admin/AdminToolbar.tsx`, `src/app/admin/products/page.tsx`, `src/app/admin/analytics/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/seller-orders/page.tsx`, `src/app/admin/orders/page.tsx`, `src/components/seller/SellerOrdersManager.tsx`
- **Page URL:** `/admin/*`, `/seller/*` (Mobile Navbar Continuous Flow & Cards/Search Audit)
- **Feedback:**
  1. Navbar should not have its back container taking space; it must be fixed/stick on the top when scrolled with content flowing behind it.
  2. Audit all tables, cards, containers, and search bars on phone screens where small widths cause items to stay in a tall column format with inflated height and broken layouts.
- **What was done:**
  - Configured `AdminMobileNav.tsx` with `fixed top-3 left-3.5 right-3.5 z-40`, eliminating in-flow document height so the canvas is continuous from `top-0` and page content scrolls smoothly behind the frosted navbar.
  - Adjusted `AdminHeader.tsx` and `admin/page.tsx` with `pt-20 md:pt-6` mobile clearance.
  - Standardized search bars across `AdminToolbar`, `products`, `orders`, `seller-orders`, and `SellerOrdersManager` so search inputs expand dynamically (`flex-1 min-w-0`) and action buttons/view switchers sit neatly on the same row without awkward wrapping or excessive vertical growth.
  - Reorganized `admin/analytics` stat cards from full-width single-column stacks into responsive 2-column grids (`grid grid-cols-2`) with compact typography and icons to eliminate bloated heights on small screens.
- **State:** Completed
