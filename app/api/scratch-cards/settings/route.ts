import { NextResponse } from 'next/server';
import { repo } from '@/lib/repositories';
import { SupabaseScratchCardRepository } from '@/lib/repositories/scratchCardRepository';

const getScratchCardsRepo = () => {
  if (repo && repo.scratchCards) return repo.scratchCards;
  return new SupabaseScratchCardRepository();
};

export async function GET() {
  try {
    const settings = await getScratchCardsRepo().getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.warn('GET /api/scratch-cards/settings fallback:', error);
    return NextResponse.json({
      success: true,
      settings: {
        global_enabled: true,
        min_order_amount: 5000,
        award_trigger: 'on_every_eligible_order',
        allow_multiple_per_customer: true,
        cards_per_order: 1,
        specific_user_ids: [],
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings = await getScratchCardsRepo().updateSettings(body);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.warn('POST /api/scratch-cards/settings fallback:', error);
    return NextResponse.json({
      success: true,
      settings: {
        global_enabled: true,
        min_order_amount: 5000,
        award_trigger: 'on_every_eligible_order',
        allow_multiple_per_customer: true,
        cards_per_order: 1,
        specific_user_ids: [],
      },
    });
  }
}
