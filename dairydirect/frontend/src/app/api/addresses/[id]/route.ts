/**
 * GET/PUT/PATCH/DELETE /api/addresses/[id]
 * RESTful single address endpoint.
 */

import { NextRequest } from 'next/server';
import {
  handleGetAddresses,
  handleUpdateAddress,
  handleDeleteAddress,
} from '@/lib/api/addresses-controller';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAddressId(context: RouteContext): Promise<string> {
  const resolvedParams = await context.params;
  return resolvedParams.id;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const id = await getAddressId(context);
  return handleGetAddresses(request, id);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const id = await getAddressId(context);
  return handleUpdateAddress(request, id);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const id = await getAddressId(context);
  return handleUpdateAddress(request, id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const id = await getAddressId(context);
  return handleDeleteAddress(request, id);
}
