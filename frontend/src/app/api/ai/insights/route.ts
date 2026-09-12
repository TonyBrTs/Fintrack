import { NextResponse } from "next/server";

interface InsightItem {
  type: "savings" | "optimization" | "warning" | "goal";
  title: string;
  desc: string;
  priority: "high" | "medium" | "low";
}

interface RequestData {
  expenses?: Array<{
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
  incomes?: Array<{
    amount: number;
    source: string;
    description: string;
    date: string;
  }>;
  goals?: Array<{
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
  }>;
  currencySymbol?: string;
  currency?: string;
}

let cachedWorkingModel: string | null = null;

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: "GET" }
    );

    if (listRes.ok) {
      const data = await listRes.json();
      const models: Array<{ name: string; supportedGenerationMethods?: string[] }> =
        data.models || [];

      // Filter only models that support generateContent
      const valid = models
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""));

      if (valid.length > 0) {
        // Prioritize: gemini-2.0-flash, gemini-1.5-flash-latest, gemini-1.5-flash, gemini-2.5-flash, etc.
        const sorted = [...valid].sort((a, b) => {
          const score = (name: string) => {
            if (name.includes("2.0-flash")) return 10;
            if (name.includes("1.5-flash-latest")) return 9;
            if (name.includes("1.5-flash")) return 8;
            if (name.includes("2.5-flash")) return 7;
            if (name.includes("flash")) return 6;
            if (name.includes("2.0")) return 5;
            if (name.includes("1.5-pro")) return 4;
            if (name.includes("pro")) return 3;
            return 1;
          };
          return score(b) - score(a);
        });

        console.log("[Gemini] Available models from API key:", sorted);
        return sorted;
      }
    } else {
      const err = await listRes.text();
      console.warn("[Gemini] ListModels returned status", listRes.status, err);
    }
  } catch (err) {
    console.warn("[Gemini] Error fetching ListModels:", err);
  }

  // Default hardcoded fallback list if ListModels was not reachable
  return [
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
  ];
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        configured: false,
        message:
          "GEMINI_API_KEY no está configurada. Agrega GEMINI_API_KEY en tu archivo frontend/.env.local",
        insights: [],
      });
    }

    const body: RequestData = await req.json().catch(() => ({}));
    const expenses = body.expenses || [];
    const incomes = body.incomes || [];
    const goals = body.goals || [];
    const currency = body.currency || "CRC";
    const currencySymbol = body.currencySymbol || "₡";

    const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalIncomes = incomes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const savingsRate =
      totalIncomes > 0
        ? ((totalIncomes - totalExpenses) / totalIncomes) * 100
        : 0;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
    });

    // Source breakdown
    const sourceTotals: Record<string, number> = {};
    incomes.forEach((i) => {
      sourceTotals[i.source] = (sourceTotals[i.source] || 0) + (Number(i.amount) || 0);
    });

    // Goals summary
    const goalsSummary = goals.map((g) => {
      const target = Number(g.target_amount) || 1;
      const current = Number(g.current_amount) || 0;
      const progress = Math.min(100, Math.round((current / target) * 100));
      return `${g.name}: ${current}/${target} (${progress}%) con límite ${g.deadline ? new Date(g.deadline).toLocaleDateString("es") : "sin fecha"}`;
    });

    const prompt = `
Eres un asesor financiero personal experto, empático, altamente motivador y estratégico.
Analiza con rigor los siguientes datos financieros reales del usuario y proporciona entre 3 y 4 consejos clave:

Moneda: ${currency} (${currencySymbol})
- Total Ingresos: ${currencySymbol}${totalIncomes.toLocaleString("es")}
- Total Gastos: ${currencySymbol}${totalExpenses.toLocaleString("es")}
- Tasa de Ahorro: ${savingsRate.toFixed(1)}%
- Desglose de Gastos por Categoría: ${JSON.stringify(categoryTotals)}
- Desglose de Ingresos por Fuente: ${JSON.stringify(sourceTotals)}
- Metas de Ahorro Activas: ${goalsSummary.length > 0 ? goalsSummary.join("; ") : "Ninguna meta registrada"}
- Cantidad de transacciones registradas: ${expenses.length} gastos y ${incomes.length} ingresos

Directrices de análisis:
1. Evalúa el balance general y la tasa de ahorro (comparando con la regla 50/30/20).
2. Si alguna categoría de gasto absorbe una parte excesiva del presupuesto, da una recomendación práctica y realista para optimizarla.
3. Si hay metas financieras, da una sugerencia concreta de aporte periódico para cumplirlas a tiempo.
4. Si los gastos superan los ingresos o el ahorro es bajo, señala con empatía dónde recortar gastos hormiga o prescindibles.
5. Mantén los títulos concisos (3 a 5 palabras) y las descripciones en máximo 2 oraciones directas, amigables y accionables en español.

Debes responder ÚNICAMENTE un array JSON con esta estructura exacta, sin texto introductorio ni formato markdown:
[
  {
    "type": "savings" | "optimization" | "warning" | "goal",
    "title": "Título corto y motivador",
    "desc": "Explicación directa basada en sus números reales.",
    "priority": "high" | "medium" | "low"
  }
]
`;

    // Discover models if not cached
    const modelsToTry = cachedWorkingModel
      ? [cachedWorkingModel]
      : await getAvailableGeminiModels(apiKey);

    // Ensure common models are present in list if initial ones fail
    const fallbackList = [
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ];
    for (const fb of fallbackList) {
      if (!modelsToTry.includes(fb)) {
        modelsToTry.push(fb);
      }
    }

    let rawContent = "";
    let lastErrorStatus = 0;
    let lastErrorText = "";

    // Try models in order until one succeeds
    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload: Record<string, unknown> = {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 900,
          },
        };

        // Newer models support responseMimeType
        if (
          model.includes("1.5") ||
          model.includes("2.0") ||
          model.includes("2.5") ||
          model.includes("flash")
        ) {
          (payload.generationConfig as Record<string, unknown>).responseMimeType =
            "application/json";
        }

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          rawContent =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawContent) {
            cachedWorkingModel = model;
            console.log(`[Gemini] Successfully generated insights using model: ${model}`);
            break;
          }
        } else {
          lastErrorStatus = geminiRes.status;
          lastErrorText = await geminiRes.text();
          console.warn(`[Gemini] Model ${model} returned ${geminiRes.status}:`, lastErrorText);
          // If 404, continue to next model in loop
        }
      } catch (callErr) {
        console.warn(`[Gemini] Call to ${model} threw error:`, callErr);
      }
    }

    if (!rawContent) {
      console.error("[Gemini] All model attempts failed. Last status:", lastErrorStatus, lastErrorText);
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          message: "Error de comunicación con Google Gemini. Usando análisis local.",
          insights: [],
        },
        { status: 200 }
      );
    }

    // Clean potential markdown wrap
    const cleaned = rawContent
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/gi, "")
      .trim();

    let parsedInsights: InsightItem[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        parsedInsights = parsed.filter(
          (item) =>
            item &&
            typeof item.title === "string" &&
            typeof item.desc === "string"
        );
      }
    } catch {
      console.warn("Failed to parse Gemini response as JSON:", cleaned);
    }

    if (parsedInsights.length === 0) {
      return NextResponse.json({
        ok: false,
        configured: true,
        message: "No se pudieron estructurar los consejos de IA.",
        insights: [],
      });
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      modelUsed: cachedWorkingModel,
      insights: parsedInsights,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error in AI insights handler:", error);
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: "Ocurrió un error inesperado al procesar el análisis con IA.",
        insights: [],
      },
      { status: 200 }
    );
  }
}
