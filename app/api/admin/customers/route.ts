import { NextResponse } from 'next/server';
import { customerRepository } from '@/lib/repositories/customerRepository';

export async function GET() {
  try {
    const customers = await customerRepository.getAllCustomers();
    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/customers] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
