"use client";

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/Sheet';
import { ProductCard } from '@/components/shared/ProductCard';
import {
  ProductGridSkeleton,
  ListSkeleton,
  CategoryRailSkeleton,
} from '@/components/shared/Skeletons';
import { CATEGORIES, categoryColors } from '@/lib/constants/categories';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import type { CatalogProduct } from '@/lib/types/catalog';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { toneFor } from '@/lib/statusTone';
import {
  Search,
  ShoppingCart,
  ArrowRight,
  Layers,
  MapPin,
} from 'lucide-react';

function sample(over: Partial<CatalogProduct> & { id: string; name: string }): CatalogProduct {
  return {
    category: 'Groceries',
    image_url: null,
    brand: 'Sample Brand Pvt Ltd',
    rating: null,
    reviews_count: 0,
    product_variants: [
      { id: `${over.id}-v1`, weight: '500 g', price: 249, original_price: null, stock: 50 },
    ],
    ...over,
  };
}

const samples: Array<{ label: string; note: string; product: CatalogProduct }> = [
  {
    label: 'Standard',
    note: 'No reviews yet, no rating shown. Strikethrough hidden.',
    product: sample({ id: 'a', name: 'Stainless Steel Pressure Cooker 3L' }),
  },
  {
    label: 'Genuine discount',
    note: 'Higher original_price triggers discount badge.',
    product: sample({
      id: 'b',
      name: 'Cold-Pressed Groundnut Oil',
      category: 'Cold-Pressed Oils',
      brand: 'Ghani Foods',
      product_variants: [
        { id: 'b-v1', weight: '1 L', price: 420, original_price: 560, stock: 30 },
      ],
    }),
  },
  {
    label: 'Rated',
    note: 'reviews_count > 0 renders the green rating pill.',
    product: sample({
      id: 'c',
      name: 'Organic Turmeric Powder',
      category: 'Spices & Masalas',
      brand: 'Nilgiri Spice Co',
      rating: 4.3,
      reviews_count: 182,
      product_variants: [
        { id: 'c-v1', weight: '200 g', price: 160, original_price: 199, stock: 8 },
      ],
    }),
  },
  {
    label: 'Low stock',
    note: 'Stock <= 10 surfaces an urgency indicator.',
    product: sample({
      id: 'd',
      name: 'Handloom Cotton Bedsheet',
      category: 'Handloom & Fashion',
      brand: 'Weaves of Bharat',
      rating: 4.8,
      reviews_count: 41,
      product_variants: [
        { id: 'd-v1', weight: 'Queen', price: 1899, original_price: null, stock: 4 },
      ],
    }),
  },
  {
    label: 'Sold out',
    note: 'Image desaturates, action disabled.',
    product: sample({
      id: 'e',
      name: 'Brass Pooja Thali Set',
      category: 'Pooja & Spiritual',
      brand: 'Moradabad Metalworks',
      product_variants: [
        { id: 'e-v1', weight: '9 inch', price: 1299, original_price: null, stock: 0 },
      ],
    }),
  },
];

function PrimitivesGrid({ themeLabel }: { themeLabel: string }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-2 flex items-center justify-between">
        <h3 className="text-h3 font-display font-semibold">{themeLabel} Specimen</h3>
        <Badge variant="brand">{themeLabel}</Badge>
      </div>

      {/* Button Matrix */}
      <div className="space-y-4">
        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider">
          Buttons: Variants & States
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="brand">Brand Saffron</Button>
          <Button variant="navy">Navy Authority</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="brand" loading>Loading</Button>
          <Button variant="brand" disabled>Disabled</Button>
          <Button variant="brand" leftIcon={<ShoppingCart className="w-4 h-4" />}>
            With Icon
          </Button>
        </div>

        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider pt-2">
          Buttons: Sizes
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <Button size="sm">Small (36px)</Button>
          <Button size="md">Medium (44px)</Button>
          <Button size="lg">Large (52px)</Button>
          <Button size="icon" aria-label="Search items">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Badge Matrix */}
      <div className="space-y-4">
        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider">
          Badges: Variants & Status Dots
        </p>
        <div className="flex flex-wrap gap-2.5 items-center">
          <Badge variant="brand">Brand</Badge>
          <Badge variant="navy">Navy</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="success" dot>Delivered</Badge>
          <Badge variant="warning" dot>Pending</Badge>
          <Badge variant="danger" dot>Cancelled</Badge>
        </div>
      </div>

      {/* Input Matrix */}
      <div className="space-y-4">
        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider">
          Input: States & Slots
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Default input (44px)..." />
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search with left icon..."
          />
          <Input
            numeric
            placeholder="Tabular numbers (₹ 240.00)"
            defaultValue="240.00"
          />
          <Input
            error="Please enter a valid Indian pincode"
            defaultValue="4000"
          />
          <Input
            disabled
            placeholder="Disabled input..."
            defaultValue="Read-only field"
          />
        </div>
      </div>

      {/* Card Matrix */}
      <div className="space-y-4">
        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider">
          Cards: Default, Elevated, and Interactive
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md">
            <h4 className="text-body font-semibold">Standard Card</h4>
            <p className="text-body-sm text-foreground-muted mt-1">
              Flat border with surface background.
            </p>
          </Card>
          <Card elevated padding="md">
            <h4 className="text-body font-semibold">Elevated Card</h4>
            <p className="text-body-sm text-foreground-muted mt-1">
              Subtle shadow-sm elevation.
            </p>
          </Card>
          <Card interactive padding="md">
            <h4 className="text-body font-semibold">Interactive Card</h4>
            <p className="text-body-sm text-foreground-muted mt-1">
              Lifts -2px with shadow on hover; tap scale on active.
            </p>
          </Card>
        </div>
      </div>

      {/* Skeleton Primitive */}
      <div className="space-y-4">
        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider">
          Skeleton: 1.2s Shimmer Placeholder
        </p>
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>

      {/* Sheet Primitive Demo */}
      <div className="space-y-4">
        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider">
          Sheet: Mobile Bottom Sheet / Desktop Dialog
        </p>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" leftIcon={<Layers className="w-4 h-4" />}>
              Open Sheet Demo
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Delivery Address Sheet</SheetTitle>
              <SheetDescription>
                Mobile slides up as a spring bottom sheet; desktop opens as a centered modal.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-3">
              <Input
                leftIcon={<MapPin className="w-4 h-4" />}
                placeholder="Apartment, Studio, or Floor"
              />
              <Input
                placeholder="Pincode (e.g. 380015)"
                numeric
              />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="brand" fullWidth>Save Address</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Empty State Primitive */}
      <div className="space-y-4">
        <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider">
          EmptyState: Centered 4-Part Primitive
        </p>
        <Card padding="md">
          <EmptyState
            illustration="📦"
            title="No orders placed yet"
            description="Explore our fresh A2 Gir cow milk and traditional bilona ghee to start your first delivery."
            action={
              <Button variant="brand" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Products
              </Button>
            }
          />
        </Card>
      </div>
      {/* Operations Data Table Demonstration */}
      <Section
        title="Operations Data Table"
        description="Generic headless-ish table component supporting sortable headers, sticky positioning, row selection, bulk action bar, stacked mobile cards, and loading/empty/error states."
      >
        <DataTableDemo />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="text-h2 font-display font-semibold text-foreground tracking-tight">{title}</h2>
      <p className="text-body-sm text-foreground-muted mt-1 mb-6 max-w-2xl leading-relaxed">{description}</p>
      {children}
    </section>
  );
}


interface DemoRow {
  id: string;
  orderNumber: string;
  customer: string;
  status: string;
  total: number;
}

const DEMO_TABLE_DATA: DemoRow[] = [
  { id: '1', orderNumber: 'ORD-9021', customer: 'Rajesh Sharma', status: 'confirmed', total: 450 },
  { id: '2', orderNumber: 'ORD-9022', customer: 'Priya Patel', status: 'delivered', total: 1250 },
  { id: '3', orderNumber: 'ORD-9023', customer: 'Amit Verma', status: 'out_for_delivery', total: 320 },
  { id: '4', orderNumber: 'ORD-9024', customer: 'Sunita Rao', status: 'pending', total: 890 },
  { id: '5', orderNumber: 'ORD-9025', customer: 'Vikram Mehta', status: 'cancelled', total: 600 },
];

function DataTableDemo() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const columns: Column<DemoRow>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      render: (row) => <span className="font-mono font-bold tabular">{row.orderNumber}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={toneFor(row.status)} dot>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total Amount',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-bold tabular">₹{row.total}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Interactive / Populated State */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">1. Interactive / Populated State (with Selection & Sorting)</h4>
        <DataTable
          columns={columns}
          data={DEMO_TABLE_DATA}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkActions={(ids, clear) => (
            <Button variant="danger" size="sm" onClick={() => { alert(`Action on ${ids.length} items`); clear(); }}>
              Archive Selected
            </Button>
          )}
          footer={
            <div className="flex justify-between items-center">
              <span>Total Orders: 5</span>
              <span className="tabular font-bold">Total: ₹3,510</span>
            </div>
          }
        />
      </div>

      {/* 2. Loading State */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">2. Loading State (8 Skeleton Shimmer Rows)</h4>
        <DataTable columns={columns} data={[]} isLoading />
      </div>

      {/* 3. Empty State */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">3. Empty State</h4>
        <DataTable
          columns={columns}
          data={[]}
          emptyTitle="No Orders Found"
          emptyDescription="Customer orders containing your products will appear here once placed."
        />
      </div>

      {/* 4. Error State */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">4. Error State (with Retry Action)</h4>
        <DataTable
          columns={columns}
          data={[]}
          error="Failed to connect to database endpoint."
          onRetry={() => alert('Retrying fetch...')}
        />
      </div>
    </div>
  );
}

export default function DesignReferencePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-10 max-w-[1600px] mx-auto">
      <header className="mb-12 border-b border-border pb-6">
        <Badge variant="brand" className="mb-2">Internal · Development Only</Badge>
        <h1 className="text-display font-display font-extrabold text-foreground tracking-tight">
          GSS Design System Specimen
        </h1>
        <p className="text-body text-foreground-muted mt-2 max-w-2xl leading-relaxed">
          Single source of truth for GSS v2 tokens, UI primitives, and component states.
          Renders light and dark side-by-side with zero artificial styling.
        </p>
      </header>

      {/* Side-by-Side Light & Dark UI Primitives Specimen */}
      <Section
        title="UI Primitives Specimen (Light & Dark)"
        description="All primitive components evaluated under both light and dark themes. Verify contrast ratios, focus rings, active scales, and accessible tap targets."
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Light Container */}
          <div className="bg-background text-foreground p-6 rounded-[var(--radius-xl)] border border-border shadow-sm">
            <PrimitivesGrid themeLabel="Light Theme" />
          </div>

          {/* Dark Container */}
          <div className="dark bg-background text-foreground p-6 rounded-[var(--radius-xl)] border border-border shadow-sm">
            <PrimitivesGrid themeLabel="Dark Theme" />
          </div>
        </div>
      </Section>

      {/* Product Card States */}
      <Section
        title="Product Card States"
        description="Hover for elevation lift, press for tap response, and tab through to see focus rings. Strikethrough appears only where a genuine original price exists."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {samples.map((s) => (
            <div key={s.product.id} className="flex flex-col">
              <ProductCard product={s.product} />
              <div className="mt-2 px-1">
                <p className="text-caption font-bold text-brand-ink uppercase tracking-wide">
                  {s.label}
                </p>
                <p className="text-micro text-foreground-muted leading-snug mt-0.5">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Structural Skeletons */}
      <Section
        title="Layout Skeletons"
        description="Shimmer placeholders reserving exact content dimensions to prevent layout shifts."
      >
        <div className="space-y-6">
          <div>
            <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider mb-3">
              Category Rail Skeleton
            </p>
            <CategoryRailSkeleton />
          </div>
          <div>
            <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider mb-3">
              Product Grid Skeleton
            </p>
            <ProductGridSkeleton count={5} />
          </div>
          <div>
            <p className="text-caption font-semibold text-foreground-muted uppercase tracking-wider mb-3">
              List Rows Skeleton
            </p>
            <ListSkeleton rows={3} />
          </div>
        </div>
      </Section>

      {/* Category Taxonomy */}
      <Section
        title="Category Taxonomy"
        description="All categories displayed with unified iconography and tokens."
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => {
            const color = categoryColors(c.name);
            return (
              <div
                key={c.key}
                className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-card)] bg-surface border border-border hover:shadow-xs transition-shadow cursor-pointer select-none"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color.bg, color: color.color }}
                >
                  <CategoryIcon name={c.icon} className="w-5 h-5" />
                </div>
                <span className="text-caption font-semibold text-foreground text-center leading-tight">
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
