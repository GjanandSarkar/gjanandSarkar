import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductByIdServer } from '@/lib/api/products.server';
import { ProductClient } from './ProductClient';
import { JsonLd } from '@/components/seo/JsonLd';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductByIdServer(id);
  
  if (!product) {
    return { title: 'Product Not Found' };
  }

  const price = product.product_variants[0]?.price.toString() || '0';

  return {
    title: product.name,
    description: product.description || undefined,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.image_url ? [product.image_url] : [],
      type: 'website',
    }
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductByIdServer(id);

  if (!product) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url || "",
    "description": product.description || "",
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Gjanand Sarkar"
    },
    "offers": {
      "@type": "AggregateOffer",
      "url": `https://gjanandsarkar.com/products/${product.id}`,
      "priceCurrency": "INR",
      "lowPrice": Math.min(...product.product_variants.map(v => v.price)),
      "highPrice": Math.max(...product.product_variants.map(v => v.price)),
      "offerCount": product.product_variants.length
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://gjanandsarkar.com/home"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product.category,
        "item": `https://gjanandsarkar.com/categories/${product.category}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name
      }
    ]
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbData} />
      <ProductClient product={product} />
    </>
  );
}
