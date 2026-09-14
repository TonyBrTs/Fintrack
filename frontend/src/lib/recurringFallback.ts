import { supabase } from "./supabaseClient";
import type { SafeFetchResult } from "./api";

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function calculateInitialDueDate(
  frequency: string,
  biweeklyType: string | undefined,
  billingDay: number = 15,
  startDateStr: string | Date
): Date {
  const start = new Date(startDateStr);
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth();
  const d = start.getUTCDate();

  if (frequency === "biweekly") {
    if (biweeklyType === "every_15_days") {
      return new Date(Date.UTC(y, m, d));
    }
    const lastDay = lastDayOfMonth(y, m);
    if (d <= 15) {
      return new Date(Date.UTC(y, m, 15));
    }
    return new Date(Date.UTC(y, m, lastDay));
  }

  if (frequency === "monthly") {
    const lastDay = lastDayOfMonth(y, m);
    const targetDay = Math.min(billingDay || 15, lastDay);
    if (d <= targetDay) {
      return new Date(Date.UTC(y, m, targetDay));
    }
    const nextM = m === 11 ? 0 : m + 1;
    const nextY = m === 11 ? y + 1 : y;
    const nextLastDay = lastDayOfMonth(nextY, nextM);
    const nextTargetDay = Math.min(billingDay || 15, nextLastDay);
    return new Date(Date.UTC(nextY, nextM, nextTargetDay));
  }

  return new Date(Date.UTC(y, m, d));
}

function calculateNextDueDate(
  frequency: string,
  biweeklyType: string | undefined,
  billingDay: number = 15,
  currentDue: Date | string
): Date {
  const d = new Date(currentDue);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  if (frequency === "biweekly") {
    if (biweeklyType === "every_15_days") {
      const next = new Date(d);
      next.setUTCDate(day + 15);
      return next;
    }
    const lastDay = lastDayOfMonth(y, m);
    if (day < 15) {
      return new Date(Date.UTC(y, m, 15));
    }
    if (day >= 15 && day < lastDay) {
      return new Date(Date.UTC(y, m, lastDay));
    }
    const nextM = m === 11 ? 0 : m + 1;
    const nextY = m === 11 ? y + 1 : y;
    return new Date(Date.UTC(nextY, nextM, 15));
  }

  if (frequency === "monthly") {
    const nextM = m === 11 ? 0 : m + 1;
    const nextY = m === 11 ? y + 1 : y;
    const nextLastDay = lastDayOfMonth(nextY, nextM);
    const targetDay = Math.min(billingDay || 15, nextLastDay);
    return new Date(Date.UTC(nextY, nextM, targetDay));
  }

  if (frequency === "weekly") {
    const next = new Date(d);
    next.setUTCDate(day + 7);
    return next;
  }

  if (frequency === "yearly") {
    const next = new Date(d);
    next.setUTCFullYear(y + 1);
    return next;
  }

  const next = new Date(d);
  next.setUTCDate(day + 15);
  return next;
}

/**
 * Executes recurring transactions directly via Supabase Client when the Go backend
 * on Render has not finished deploying or is temporarily returning 404.
 */
export async function handleRecurringFallback<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<SafeFetchResult<T> | null> {
  const isExpense = endpoint.includes("recurring-expenses");
  const isIncome = endpoint.includes("recurring-incomes");

  if (!isExpense && !isIncome) {
    return null;
  }

  const tableName = isExpense ? "recurring_expenses" : "recurring_incomes";
  const transactionTable = isExpense ? "expenses" : "incomes";
  const method = (options.method || "GET").toUpperCase();

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (sessionErr || !user) {
      return {
        ok: false,
        status: 401,
        data: null,
        error: "Sesión requerida para gestionar transacciones recurrentes.",
        isUnauthorized: true,
      };
    }

    // 1. SYNC: /api/recurring-.../sync
    if (endpoint.endsWith("/sync") && method === "POST") {
      const now = new Date();
      const endOfToday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)
      ).toISOString();

      const { data: dueItems, error: fetchErr } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .lte("next_due_date", endOfToday);

      if (fetchErr) {
        return { ok: false, status: 500, data: null, error: fetchErr.message };
      }

      const createdList: any[] = [];

      for (const item of dueItems || []) {
        let currentDue = new Date(item.next_due_date);
        let lastExec = new Date().toISOString();
        let iterations = 0;

        while (currentDue <= new Date(endOfToday) && iterations < 48) {
          iterations++;

          if (item.end_date && currentDue > new Date(item.end_date)) {
            await supabase.from(tableName).update({ is_active: false }).eq("id", item.id);
            break;
          }

          const recordId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const payload: any = {
            id: recordId,
            user_id: user.id,
            amount: item.amount,
            currency: item.currency || "USD",
            description: item.description,
            payment_method: item.payment_method,
            date: currentDue.toISOString(),
          };

          if (isExpense) {
            payload.category = item.category;
          } else {
            payload.source = item.source;
          }

          const { data: createdRecord, error: insertErr } = await supabase
            .from(transactionTable)
            .insert(payload)
            .select()
            .single();

          if (!insertErr && createdRecord) {
            createdList.push(createdRecord);
          }

          currentDue = calculateNextDueDate(item.frequency, item.biweekly_type, item.billing_day, currentDue);
        }

        await supabase
          .from(tableName)
          .update({
            next_due_date: currentDue.toISOString(),
            last_executed_at: lastExec,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }

      return {
        ok: true,
        status: 200,
        data: {
          processed_count: createdList.length,
          [isExpense ? "expenses" : "incomes"]: createdList,
        } as T,
      };
    }

    // 2. EXECUTE NOW: /api/recurring-.../:id/execute-now
    if (endpoint.includes("/execute-now") && method === "POST") {
      const parts = endpoint.split("/");
      const idIdx = parts.findIndex((p) => p === "recurring-expenses" || p === "recurring-incomes") + 1;
      const id = parts[idIdx];

      const { data: item, error: fetchErr } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchErr || !item) {
        return { ok: false, status: 404, data: null, error: "Registro no encontrado" };
      }

      const now = new Date();
      const recordId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload: any = {
        id: recordId,
        user_id: user.id,
        amount: item.amount,
        currency: item.currency || "USD",
        description: item.description,
        payment_method: item.payment_method,
        date: now.toISOString(),
      };

      if (isExpense) {
        payload.category = item.category;
      } else {
        payload.source = item.source;
      }

      const { data: createdRecord, error: insertErr } = await supabase
        .from(transactionTable)
        .insert(payload)
        .select()
        .single();

      if (insertErr) {
        return { ok: false, status: 500, data: null, error: insertErr.message };
      }

      const nextDue = calculateNextDueDate(item.frequency, item.biweekly_type, item.billing_day, item.next_due_date);
      await supabase
        .from(tableName)
        .update({
          next_due_date: nextDue.toISOString(),
          last_executed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", id);

      return {
        ok: true,
        status: 200,
        data: {
          message: "Operación completada con éxito",
          [isExpense ? "expense" : "income"]: createdRecord,
        } as T,
      };
    }

    // 3. GET ALL: /api/recurring-expenses or /api/recurring-incomes
    if (method === "GET" && (endpoint.endsWith("recurring-expenses") || endpoint.endsWith("recurring-incomes"))) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", user.id)
        .order("is_active", { ascending: false })
        .order("next_due_date", { ascending: true });

      if (error) {
        return { ok: false, status: 500, data: null, error: error.message };
      }

      return { ok: true, status: 200, data: (data || []) as T };
    }

    // 4. POST (CREATE): /api/recurring-expenses or /api/recurring-incomes
    if (method === "POST" && (endpoint.endsWith("recurring-expenses") || endpoint.endsWith("recurring-incomes"))) {
      const body = typeof options.body === "string" ? JSON.parse(options.body) : options.body || {};
      const recordId = body.id || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const startDate = body.start_date ? new Date(body.start_date) : new Date();

      const nextDue = body.next_due_date
        ? new Date(body.next_due_date)
        : calculateInitialDueDate(
            body.frequency || "biweekly",
            body.biweekly_type || "15_and_last_day",
            Number(body.billing_day) || 15,
            startDate
          );

      const record = {
        ...body,
        id: recordId,
        user_id: user.id,
        start_date: startDate.toISOString(),
        next_due_date: nextDue.toISOString(),
        is_active: body.is_active ?? true,
        auto_register: body.auto_register ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from(tableName).insert(record).select().single();

      if (error) {
        return { ok: false, status: 400, data: null, error: error.message };
      }

      return { ok: true, status: 201, data: data as T };
    }

    // 5. PUT (UPDATE): /api/recurring-.../:id
    if (method === "PUT") {
      const parts = endpoint.split("/");
      const id = parts[parts.length - 1];
      const body = typeof options.body === "string" ? JSON.parse(options.body) : options.body || {};

      const updateData: any = { ...body, updated_at: new Date().toISOString() };
      delete updateData.id;
      delete updateData.user_id;

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return { ok: false, status: 400, data: null, error: error.message };
      }

      return { ok: true, status: 200, data: data as T };
    }

    // 6. DELETE: /api/recurring-.../:id
    if (method === "DELETE") {
      const parts = endpoint.split("/");
      const id = parts[parts.length - 1];

      const { error } = await supabase.from(tableName).delete().eq("id", id).eq("user_id", user.id);

      if (error) {
        return { ok: false, status: 400, data: null, error: error.message };
      }

      return { ok: true, status: 200, data: { message: "Eliminado exitosamente" } as T };
    }

    return null;
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: err?.message || "Error al procesar en Supabase",
    };
  }
}
