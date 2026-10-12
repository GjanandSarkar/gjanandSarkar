/**
 * GET/POST/PUT/DELETE /api/addresses
 * Production E-commerce Delivery Address API.
 */

import { NextRequest } from 'next/server';
import {
  handleGetAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleDeleteAddress,
} from '@/lib/api/addresses-controller';

export async function GET(request: NextRequest) {
  return handleGetAddresses(request);
}

export async function POST(request: NextRequest) {
  return handleCreateAddress(request);
}

export async function PUT(request: NextRequest) {
  return handleUpdateAddress(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdateAddress(request);
}

export async function DELETE(request: NextRequest) {
  return handleDeleteAddress(request);
}