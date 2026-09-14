-- ===================================================================
-- Migración: Tabla de Ingresos Fijos y Recurrentes (FinTrack)
-- Buenas Prácticas: RLS, CHECK constraints, Índices, Triggers
-- ===================================================================

-- 1. Función reusable para actualización automática de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear tabla recurring_incomes
CREATE TABLE IF NOT EXISTS public.recurring_incomes (
    id VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    source VARCHAR(100) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'biweekly' 
        CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
    biweekly_type VARCHAR(30) DEFAULT '15_and_last_day' 
        CHECK (biweekly_type IS NULL OR biweekly_type IN ('15_and_last_day', 'every_15_days')),
    billing_day INT DEFAULT 15 
        CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 31)),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    next_due_date TIMESTAMPTZ NOT NULL,
    last_executed_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auto_register BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_recurring_incomes_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 3. Índices estratégicos para optimización de rendimiento
CREATE INDEX IF NOT EXISTS idx_recurring_incomes_user_due 
    ON public.recurring_incomes(user_id, next_due_date ASC);

CREATE INDEX IF NOT EXISTS idx_recurring_incomes_active_due 
    ON public.recurring_incomes(is_active, auto_register, next_due_date ASC);

CREATE INDEX IF NOT EXISTS idx_recurring_incomes_user_source 
    ON public.recurring_incomes(user_id, source);

CREATE INDEX IF NOT EXISTS idx_recurring_incomes_user_id 
    ON public.recurring_incomes(user_id);

-- 4. Trigger a nivel motor para updated_at
DROP TRIGGER IF EXISTS trg_recurring_incomes_updated_at ON public.recurring_incomes;
CREATE TRIGGER trg_recurring_incomes_updated_at
    BEFORE UPDATE ON public.recurring_incomes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- También añadir el trigger a recurring_expenses para homogeneizar mejores prácticas
DROP TRIGGER IF EXISTS trg_recurring_expenses_updated_at ON public.recurring_expenses;
CREATE TRIGGER trg_recurring_expenses_updated_at
    BEFORE UPDATE ON public.recurring_expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 5. Habilitar Seguridad a Nivel de Fila (Row Level Security - RLS)
ALTER TABLE public.recurring_incomes ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de aislamiento multi-tenant en Supabase
DROP POLICY IF EXISTS "Users can only select their own recurring incomes" ON public.recurring_incomes;
CREATE POLICY "Users can only select their own recurring incomes" 
ON public.recurring_incomes FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own recurring incomes" ON public.recurring_incomes;
CREATE POLICY "Users can only insert their own recurring incomes" 
ON public.recurring_incomes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own recurring incomes" ON public.recurring_incomes;
CREATE POLICY "Users can only update their own recurring incomes" 
ON public.recurring_incomes FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own recurring incomes" ON public.recurring_incomes;
CREATE POLICY "Users can only delete their own recurring incomes" 
ON public.recurring_incomes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
