-- SQL Migration for Marketing, Rewards, Scratch Cards, Offers, Referrals, etc.

-- 1. Marketing Configs (Homepage ordering, Popups, Announcement Bar)
CREATE TABLE IF NOT EXISTS marketing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rewards Engine (Cart tier unlocks)
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_type TEXT NOT NULL, -- e.g. 'FREE_PRODUCT', 'COUPON', 'CASHBACK', 'FREE_SHIPPING', 'SCRATCH_CARD', 'BUY_X_GET_Y'
    minimum_purchase NUMERIC NOT NULL DEFAULT 0,
    reward_value JSONB, -- Could be { "coupon_code": "...", "product_id": "...", "amount": ... }
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Scratch Cards (Configuration)
CREATE TABLE IF NOT EXISTS scratch_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT,
    reward_type TEXT NOT NULL, -- e.g. 'COUPON', 'GIFT', 'DISCOUNT'
    reward_value JSONB,
    probability NUMERIC NOT NULL DEFAULT 0, -- 0.0 to 1.0
    stock_limit INTEGER, -- NULL means unlimited
    active_from TIMESTAMPTZ,
    active_until TIMESTAMPTZ,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Rewards (Tracking claims & scratch cards)
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_source TEXT NOT NULL, -- 'SCRATCH_CARD', 'TIER_REWARD', 'REFERRAL', 'GIVEAWAY'
    source_id UUID, -- ID of the scratch card or campaign
    reward_type TEXT NOT NULL,
    reward_value JSONB,
    is_used BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- 5. Offers / Campaigns (Flash Sales, Clearance, etc)
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    offer_type TEXT NOT NULL, -- 'CLEARANCE', 'FLASH_SALE', 'BOGO', 'FLAT_DISCOUNT', 'PERCENTAGE'
    target_category TEXT,
    target_products JSONB, -- Array of product IDs
    discount_value JSONB, -- e.g. { "type": "percentage", "amount": 50 }
    banner_url TEXT,
    active_from TIMESTAMPTZ,
    active_until TIMESTAMPTZ,
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add alternative_phone to orders table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='alternate_phone') THEN
        ALTER TABLE orders ADD COLUMN alternate_phone TEXT;
    END IF;
END $$;

-- 7. Giveaways
CREATE TABLE IF NOT EXISTS giveaways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 1,
    winner_selection_type TEXT, -- 'RANDOM', 'MANUAL'
    schedule_date TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACTIVE', 'COMPLETED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS Policies (Assuming open for now for admin panel, restricted via API endpoints)
