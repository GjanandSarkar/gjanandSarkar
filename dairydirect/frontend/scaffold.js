const fs = require('fs');
const path = require('path');

const routes = {
  customer: ['subscription', 'store', 'cart', 'tracking', 'profile', 'notifications', 'report-issue'],
  admin: ['orders', 'forecast', 'complaints', 'subscriptions'],
  delivery: ['task', 'complete']
};

function createLayout(type) {
  const isMobile = type !== 'admin';
  return "'use client';\n" +
"import Link from 'next/link';\n" +
"export function " + (type.charAt(0).toUpperCase() + type.slice(1)) + "Layout({ children }: { children: React.ReactNode }) {\n" +
"  return (\n" +
"    <div className=\"min-h-screen " + (isMobile ? 'pb-24' : 'flex') + "\">\n" +
      (!isMobile ? 
"      <aside className=\"w-64 bg-surface-container-lowest border-r border-border h-screen sticky top-0 hidden md:block\">\n" +
"        <div className=\"p-6 font-bold text-xl text-primary\">DairyDirect Admin</div>\n" +
"        <nav className=\"flex flex-col gap-2 px-4\">\n" +
"          <Link href=\"/admin\" className=\"p-2 hover:bg-surface-container-low rounded-lg text-sm\">Dashboard</Link>\n" +
"          <Link href=\"/admin/orders\" className=\"p-2 hover:bg-surface-container-low rounded-lg text-sm\">Orders</Link>\n" +
"          <Link href=\"/admin/forecast\" className=\"p-2 hover:bg-surface-container-low rounded-lg text-sm\">Forecast</Link>\n" +
"          <Link href=\"/admin/complaints\" className=\"p-2 hover:bg-surface-container-low rounded-lg text-sm\">Complaints</Link>\n" +
"        </nav>\n" +
"      </aside>\n" : "") +
"      <main className=\"" + (isMobile ? 'w-full' : 'flex-1 p-8') + "\">\n" +
"        {children}\n" +
"      </main>\n" +
      (isMobile && type === 'delivery' ? 
"      <nav className=\"fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-background/80 backdrop-blur-md rounded-t-2xl z-50 border-t border-border\">\n" +
"         <Link href=\"/delivery\" className=\"flex flex-col items-center p-2 text-primary text-xs\">Tasks</Link>\n" +
"      </nav>\n" : "") +
"    </div>\n" +
"  );\n" +
"}\n";
}

function createPage(name) {
  return "export default function " + name.replace(/[^a-zA-Z]/g, '') + "Page() {\n" +
"  return (\n" +
"    <div className=\"p-6\">\n" +
"      <h1 className=\"text-2xl font-bold tracking-tight mb-4\">" + name + "</h1>\n" +
"      <p className=\"text-muted-foreground\">This is the " + name + " page. Built with shadcn/ui and Tailwind v4.</p>\n" +
"    </div>\n" +
"  );\n" +
"}\n";
}

// Layouts
fs.mkdirSync('components/layouts', { recursive: true });
fs.writeFileSync('components/layouts/AdminLayout.tsx', createLayout('admin'));
fs.writeFileSync('components/layouts/DeliveryLayout.tsx', createLayout('delivery'));

// Root Layouts for group
fs.mkdirSync('app/(admin)', { recursive: true });
fs.writeFileSync('app/(admin)/layout.tsx', "import { AdminLayout } from '@/components/layouts/AdminLayout';\nexport default function Layout({ children }: { children: React.ReactNode }) { return <AdminLayout>{children}</AdminLayout>; }");

fs.mkdirSync('app/(delivery)', { recursive: true });
fs.writeFileSync('app/(delivery)/layout.tsx', "import { DeliveryLayout } from '@/components/layouts/DeliveryLayout';\nexport default function Layout({ children }: { children: React.ReactNode }) { return <DeliveryLayout>{children}</DeliveryLayout>; }");

// Customer routes
routes.customer.forEach(r => {
  const dir = path.join('app', '(customer)', r);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.tsx'), createPage(r));
});

// Admin routes
['.', ...routes.admin].forEach(r => {
  const dir = path.join('app', '(admin)', 'admin', r === '.' ? '' : r);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.tsx'), createPage(r === '.' ? 'Admin Dashboard' : r));
});

// Delivery routes
['.', ...routes.delivery].forEach(r => {
  const dir = path.join('app', '(delivery)', 'delivery', r === '.' ? '' : r);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.tsx'), createPage(r === '.' ? 'Delivery Dashboard' : r));
});

console.log('Scaffolding complete.');
