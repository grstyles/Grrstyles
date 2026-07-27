import { NextResponse } from 'next/server';
import { repo } from '@/lib/repositories';

export async function GET() {
  try {
    const winners = await repo.scratchCards.getWinnersList();

    const headers = ['User Email', 'User ID', 'Card Title', 'Reward Type', 'Reward Value', 'Coupon Code', 'Order Number', 'Claimed At'];
    const rows = winners.map((w) => [
      w.user_email || 'N/A',
      w.user_id,
      `"${(w.card_title || 'Scratch Card').replace(/"/g, '""')}"`,
      w.reward_type,
      w.reward_value,
      w.coupon_code || 'N/A',
      w.order_number || 'N/A',
      w.claimed_at ? new Date(w.claimed_at).toISOString() : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="scratch_card_winners.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
