-- ===================================================================
-- Migración: Tabla de Gastos Fijos y Recurrentes (FinTrack)
-- Ejecuta este script en el Editor SQL de tu proyecto en Supabase
-- ===================================================================

-- 1. Crear tabla recurring_expenses
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    category VARCHAR(100) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'biweekly',
    biweekly_type VARCHAR(30) DEFAULT '15_and_last_day',
    billing_day INT DEFAULT 15 CHECK (billing_day >= 1 AND billing_day <= 31),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    next_due_date TIMESTAMPTZ NOT NULL,
    last_executed_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auto_register BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para optimización de consultas
-- Consulta frecuente por usuario y próxima fecha de vencimiento
CREATE INDEX IF NOT EXISTS idx_recurring_user_due 
    ON public.recurring_expenses(user_id, next_due_date ASC);

-- Consulta del motor de automatización (gastos pendientes de ejecutar)
CREATE INDEX IF NOT EXISTS idx_recurring_active_due 
    ON public.recurring_expenses(is_active, auto_register, next_due_date ASC);

-- Consulta para filtros por categoría
CREATE INDEX IF NOT EXISTS idx_recurring_user_category 
    ON public.recurring_expenses(user_id, category);

-- 3. Habilitar Seguridad a Nivel de Fila (Row Level Security - RLS)
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de aislamiento multi-tenant en Supabase
DROP POLICY IF EXISTS "Users can only select their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can only select their own recurring expenses" 
ON public.recurring_expenses FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can only insert their own recurring expenses" 
ON public.recurring_expenses FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can only update their own recurring expenses" 
ON public.recurring_expenses FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can only delete their own recurring expenses" 
ON public.recurring_expenses FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
