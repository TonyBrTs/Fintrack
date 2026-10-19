-- Migration: 20261018_create_vault_tables.sql
-- Description: Financial Vault for bank accounts, cards, and security settings

CREATE TABLE IF NOT EXISTS public.vault_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank VARCHAR(50) NOT NULL DEFAULT 'other',
    bank_name VARCHAR(100) NOT NULL DEFAULT '',
    card_type VARCHAR(20) NOT NULL DEFAULT 'credit', -- 'credit', 'debit', 'account'
    card_network VARCHAR(20) NOT NULL DEFAULT 'visa', -- 'visa', 'mastercard', 'amex', 'carnet', 'other'
    alias VARCHAR(100) NOT NULL,
    cardholder_name VARCHAR(150) NOT NULL DEFAULT '',
    card_number VARCHAR(100) NOT NULL DEFAULT '',
    last4 VARCHAR(4) NOT NULL DEFAULT '',
    clabe VARCHAR(100) DEFAULT '',
    account_number VARCHAR(100) DEFAULT '',
    expiration_date VARCHAR(20) DEFAULT '',
    cvv VARCHAR(20) DEFAULT '',
    cut_off_day INT DEFAULT NULL,
    payment_due_day INT DEFAULT NULL,
    credit_limit NUMERIC(12, 2) DEFAULT NULL,
    currency VARCHAR(10) DEFAULT 'MXN',
    color_scheme VARCHAR(50) DEFAULT 'auto',
    bank_phone VARCHAR(50) DEFAULT '',
    notes TEXT DEFAULT '',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vault_cards' AND policyname = 'Users can manage their own vault cards'
    ) THEN
        CREATE POLICY "Users can manage their own vault cards"
        ON public.vault_cards
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.vault_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    auto_lock_minutes INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vault_settings' AND policyname = 'Users can manage their own vault settings'
    ) THEN
        CREATE POLICY "Users can manage their own vault settings"
        ON public.vault_settings
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
