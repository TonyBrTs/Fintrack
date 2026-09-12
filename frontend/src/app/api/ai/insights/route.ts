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

    // Call Google Gemini API (gemini-1.5-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
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

    const geminiData = await geminiRes.json();
    const rawContent =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
