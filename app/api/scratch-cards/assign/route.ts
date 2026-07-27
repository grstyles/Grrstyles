import { NextResponse } from 'next/server';
import { repo } from '@/lib/repositories';

export async function POST(req: Request) {
  try {
    const { userId, userEmail, cardId, orderId, orderNumber } = await req.json();
    if (!cardId) {
      return NextResponse.json({ success: false, error: 'Card ID is required' }, { status: 400 });
    }
    if (!userId && !userEmail) {
      return NextResponse.json({ success: false, error: 'User ID or Email is required' }, { status: 400 });
    }

    const assigned = await repo.scratchCards.assignCardToUser(
      userId || userEmail || 'user-assigned',
      cardId,
      userEmail,
      orderId,
      orderNumber
    );

    return NextResponse.json({ success: true, assigned });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
