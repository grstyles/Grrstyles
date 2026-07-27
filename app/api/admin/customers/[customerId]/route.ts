import { NextResponse, NextRequest } from 'next/server';
import { customerRepository } from '@/lib/repositories/customerRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const customer = await customerRepository.getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/customers/[customerId]] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch customer detail' },
      { status: 500 }
    );
  }
}
