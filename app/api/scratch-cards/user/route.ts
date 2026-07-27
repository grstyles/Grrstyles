import { NextResponse } from 'next/server';
import { repo } from '@/lib/repositories';
import { SupabaseScratchCardRepository } from '@/lib/repositories/scratchCardRepository';

const getScratchCardsRepo = () => {
  if (repo && repo.scratchCards) return repo.scratchCards;
  return new SupabaseScratchCardRepository();
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const email = searchParams.get('email') || undefined;

    const cards = await getScratchCardsRepo().getUserCards(userId, email);
    return NextResponse.json({ success: true, cards });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
