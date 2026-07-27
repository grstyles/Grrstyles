import { NextResponse } from 'next/server';
import { repo } from '@/lib/repositories';
import { SupabaseScratchCardRepository } from '@/lib/repositories/scratchCardRepository';

const getScratchCardsRepo = () => {
  if (repo && repo.scratchCards) return repo.scratchCards;
  return new SupabaseScratchCardRepository();
};

export async function POST(req: Request) {
  try {
    const { userCardId, userId, action } = await req.json();
    if (!userCardId) {
      return NextResponse.json({ success: false, error: 'User card ID is required' }, { status: 400 });
    }

    const scratchRepo = getScratchCardsRepo();
    if (action === 'scratch') {
      const res = await scratchRepo.scratchCard(userCardId, userId);
      return NextResponse.json(res);
    }

    const result = await scratchRepo.claimReward(userCardId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
