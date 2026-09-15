import ExcelJS from "exceljs";

export interface ExcelExportData {
  reportReference: string;
  user: {
    name?: string;
    email?: string;
  };
  periodLabel: string;
  generatedAt: string;
  currencySymbol: string;
  notes?: string;
  isEs: boolean;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  filteredExpenses: Array<{
    date: string | Date;
    description?: string;
    category?: string;
    payment_method?: string;
    amount: number;
  }>;
  filteredIncomes: Array<{
    date: string | Date;
    description?: string;
    source?: string;
    payment_method?: string;
    amount: number;
  }>;
  goals: Array<{
    name: string;
    current_amount: number;
    target_amount: number;
  }>;
  formatDateDisplay: (d: string | Date) => string;
  translateCategory: (cat?: string) => string;
  translateSource: (src?: string) => string;
  translatePaymentMethod: (pm?: string) => string;
}

export async function exportFinancialReportExcel(data: ExcelExportData): Promise<void> {
  const {
    reportReference,
    user,
    periodLabel,
    generatedAt,
    currencySymbol,
    notes,
    isEs,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    filteredExpenses,
    filteredIncomes,
    goals,
    formatDateDisplay,
    translateCategory,
    translateSource,
    translatePaymentMethod,
  } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FinTrack Financial App";
  wb.lastModifiedBy = user.name || "FinTrack User";
  wb.created = new Date();
  wb.modified = new Date();

  // Style constants
  const FONT_FAMILY = "Segoe UI";
  const COLOR_HEADER_FILL = "1E293B"; // Dark slate
  const COLOR_EXPENSE_FILL = "991B1B"; // Deep red
  const COLOR_INCOME_FILL = "065F46"; // Deep emerald
  const COLOR_GOAL_FILL = "3730A3"; // Deep indigo
  const COLOR_ZEBRA_ODD = "F8FAFC"; // Very light slate
  const COLOR_TOTAL_FILL = "F1F5F9"; // Light slate for totals
  const BORDER_LIGHT: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "E2E8F0" } },
    bottom: { style: "thin", color: { argb: "E2E8F0" } },
    left: { style: "thin", color: { argb: "E2E8F0" } },
    right: { style: "thin", color: { argb: "E2E8F0" } },
  };

  const currencyFormat = `"${currencySymbol}"#,##0.00;[Red]("${currencySymbol}"#,##0.00);"${currencySymbol}"0.00`;

  // Helper to style a header row
  const applyHeaderStyle = (row: ExcelJS.Row, fillHex: string) => {
    row.height = 28;
    row.eachCell((cell) => {
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillHex },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "medium", color: { argb: fillHex } },
        bottom: { style: "medium", color: { argb: fillHex } },
        left: { style: "thin", color: { argb: "FFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFF" } },
      };
    });
  };

  // Helper to auto-fit columns
  const autoFitColumns = (ws: ExcelJS.Worksheet, minWidths: Record<number, number> = {}) => {
    ws.columns.forEach((col, idx) => {
      let maxLen = 10;
      const colNumber = (idx + 1);
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        if (val.length > maxLen) {
          maxLen = Math.min(val.length, 50);
        }
      });
      const minW = minWidths[colNumber] || 12;
      col.width = Math.max(maxLen + 4, minW);
    });
  };

  // --------------------------------------------------------------------------
  // 1. HOJA RESUMEN EJECUTIVO
  // --------------------------------------------------------------------------
  const wsSummary = wb.addWorksheet(isEs ? "Resumen" : "Summary", {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  wsSummary.mergeCells("B2:E2");
  const titleCell = wsSummary.getCell("B2");
  titleCell.value = "FINTRACK";
  titleCell.font = { name: FONT_FAMILY, size: 18, bold: true, color: { argb: "1E3A8A" } };
  titleCell.alignment = { vertical: "middle" };
  wsSummary.getRow(2).height = 26;

  wsSummary.mergeCells("B3:E3");
  const subtitleCell = wsSummary.getCell("B3");
  subtitleCell.value = isEs
    ? "ESTADO FINANCIERO Y RENDICIÓN DE CUENTAS"
    : "OFFICIAL FINANCIAL STATEMENT & AUDIT SUMMARY";
  subtitleCell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: "64748B" } };
  subtitleCell.alignment = { vertical: "middle" };
  wsSummary.getRow(3).height = 20;

  // Metadata Box
  const metaStartRow = 5;
  const metaRows: [string, string][] = [
    [isEs ? "Referencia Contable:" : "Audit Reference:", reportReference],
    [isEs ? "Titular:" : "Account Holder:", user.name || user.email || (isEs ? "Titular FinTrack" : "Account Holder")],
    [isEs ? "Correo Electrónico:" : "Email:", user.email || "N/A"],
    [isEs ? "Período Consultado:" : "Consulted Period:", periodLabel],
    [isEs ? "Fecha de Emisión:" : "Issued Date:", generatedAt],
  ];

  metaRows.forEach((item, i) => {
    const rowIdx = metaStartRow + i;
    const r = wsSummary.getRow(rowIdx);
    r.height = 20;

    const labelCell = wsSummary.getCell(`B${rowIdx}`);
    labelCell.value = item[0];
    labelCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "334155" } };
    labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
    labelCell.alignment = { vertical: "middle", horizontal: "left" };
    labelCell.border = BORDER_LIGHT;

    wsSummary.mergeCells(`C${rowIdx}:E${rowIdx}`);
    const valCell = wsSummary.getCell(`C${rowIdx}`);
    valCell.value = item[1];
    valCell.font = { name: FONT_FAMILY, size: 10, color: { argb: "0F172A" } };
    valCell.alignment = { vertical: "middle", horizontal: "left" };
    valCell.border = BORDER_LIGHT;
  });

  // KPI / Balance Section Header
  const kpiStartRow = 12;
  wsSummary.mergeCells(`B${kpiStartRow}:E${kpiStartRow}`);
  const kpiHeader = wsSummary.getCell(`B${kpiStartRow}`);
  kpiHeader.value = isEs ? "BALANCE GENERAL Y RENDIMIENTO" : "EXECUTIVE BALANCE & PERFORMANCE";
  kpiHeader.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: "FFFFFF" } };
  kpiHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_FILL } };
  kpiHeader.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsSummary.getRow(kpiStartRow).height = 26;

  // Table Columns
  const kpiColsRow = kpiStartRow + 1;
  const colB = wsSummary.getCell(`B${kpiColsRow}`);
  colB.value = isEs ? "Concepto Contable" : "Ledger Concept";
  const colC = wsSummary.getCell(`C${kpiColsRow}`);
  colC.value = isEs ? "Monto" : "Amount";
  const colD = wsSummary.getCell(`D${kpiColsRow}`);
  colD.value = isEs ? "Moneda" : "Currency";
  const colE = wsSummary.getCell(`E${kpiColsRow}`);
  colE.value = isEs ? "Proporción / Nota" : "Ratio / Note";

  [colB, colC, colD, colE].forEach((c) => {
    c.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: "475569" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } };
    c.alignment = { vertical: "middle", horizontal: c === colC ? "right" : "center" };
    c.border = BORDER_LIGHT;
  });
  wsSummary.getRow(kpiColsRow).height = 22;

  // KPI Data Rows
  const kpiItems = [
    {
      label: isEs ? "(+) Total Ingresos Percibidos" : "(+) Total Inflows Received",
      amount: totalIncome,
      currency: currencySymbol,
      note: isEs ? "100% ingresos base" : "100% base inflows",
      fontColor: "047857",
      bold: true,
    },
    {
      label: isEs ? "(-) Total Egresos Realizados" : "(-) Total Outflows Executed",
      amount: totalExpense,
      currency: currencySymbol,
      note: totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(1)}% de ingresos` : "---",
      fontColor: "B91C1C",
      bold: true,
    },
    {
      label: isEs ? "(=) Balance Financiero Neto" : "(=) Net Financial Balance",
      amount: netSavings,
      currency: currencySymbol,
      note: netSavings >= 0 ? (isEs ? "Superávit neto" : "Net surplus") : (isEs ? "Déficit neto" : "Net deficit"),
      fontColor: netSavings >= 0 ? "065F46" : "991B1B",
      bold: true,
      highlight: true,
    },
    {
      label: isEs ? "Tasa de Ahorro (%)" : "Savings Rate (%)",
      amount: savingsRate / 100,
      currency: "%",
      isPercent: true,
      note: savingsRate >= 20 ? (isEs ? "Objetivo saludable (>=20%)" : "Healthy target (>=20%)") : (isEs ? "Margen bajo (<20%)" : "Low margin (<20%)"),
      fontColor: savingsRate >= 0 ? "1E40AF" : "B91C1C",
      bold: false,
    },
    {
      label: isEs ? "Total Transacciones Procesadas" : "Total Processed Transactions",
      amount: filteredExpenses.length + filteredIncomes.length,
      currency: isEs ? "movs." : "txs.",
      isCount: true,
      note: `${filteredIncomes.length} ${isEs ? "ingresos" : "in"}, ${filteredExpenses.length} ${isEs ? "egresos" : "out"}`,
      fontColor: "334155",
      bold: false,
    },
  ];

  let currentKpiRow = kpiColsRow + 1;
  kpiItems.forEach((item) => {
    const row = wsSummary.getRow(currentKpiRow);
    row.height = 22;

    const cellLabel = wsSummary.getCell(`B${currentKpiRow}`);
    cellLabel.value = item.label;
    cellLabel.font = { name: FONT_FAMILY, size: 10, bold: item.bold, color: { argb: item.fontColor } };
    cellLabel.border = BORDER_LIGHT;
    cellLabel.alignment = { vertical: "middle", horizontal: "left" };

    const cellAmt = wsSummary.getCell(`C${currentKpiRow}`);
    cellAmt.value = item.amount;
    cellAmt.font = { name: FONT_FAMILY, size: 10, bold: item.bold, color: { argb: item.fontColor } };
    cellAmt.border = BORDER_LIGHT;
    cellAmt.alignment = { vertical: "middle", horizontal: "right" };

    if (item.isPercent) {
      cellAmt.numFmt = "0.0%";
    } else if (item.isCount) {
      cellAmt.numFmt = "#,##0";
    } else {
      cellAmt.numFmt = currencyFormat;
    }

    const cellCur = wsSummary.getCell(`D${currentKpiRow}`);
    cellCur.value = item.currency;
    cellCur.font = { name: FONT_FAMILY, size: 9, color: { argb: "64748B" } };
    cellCur.border = BORDER_LIGHT;
    cellCur.alignment = { vertical: "middle", horizontal: "center" };

    const cellNote = wsSummary.getCell(`E${currentKpiRow}`);
    cellNote.value = item.note;
    cellNote.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: "64748B" } };
    cellNote.border = BORDER_LIGHT;
    cellNote.alignment = { vertical: "middle", horizontal: "left" };

    if (item.highlight) {
      const fillBg = netSavings >= 0 ? "DCFCE7" : "FEE2E2";
      [cellLabel, cellAmt, cellCur, cellNote].forEach((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillBg } };
        c.border = {
          top: { style: "thin", color: { argb: "94A3B8" } },
          bottom: { style: "double", color: { argb: "94A3B8" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } },
        };
      });
    }

    currentKpiRow++;
  });

  // Optional Notes section
  if (notes && notes.trim()) {
    currentKpiRow += 2;
    wsSummary.mergeCells(`B${currentKpiRow}:E${currentKpiRow}`);
    const notesHdr = wsSummary.getCell(`B${currentKpiRow}`);
    notesHdr.value = isEs ? "NOTAS / OBSERVACIONES CONTABLES" : "ACCOUNTING NOTES & AUDIT REMARKS";
    notesHdr.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "1E293B" } };
    notesHdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
    notesHdr.border = BORDER_LIGHT;
    notesHdr.alignment = { vertical: "middle" };
    wsSummary.getRow(currentKpiRow).height = 24;

    currentKpiRow++;
    wsSummary.mergeCells(`B${currentKpiRow}:E${currentKpiRow + 2}`);
    const notesBody = wsSummary.getCell(`B${currentKpiRow}`);
    notesBody.value = notes.trim();
    notesBody.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: "334155" } };
    notesBody.alignment = { vertical: "top", horizontal: "left", wrapText: true };
    notesBody.border = BORDER_LIGHT;
    notesBody.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } };
  }

  // Adjust column widths on Summary
  wsSummary.getColumn(1).width = 4; // Margin column A
  wsSummary.getColumn(2).width = 36; // Concept
  wsSummary.getColumn(3).width = 20; // Amount
  wsSummary.getColumn(4).width = 12; // Currency
  wsSummary.getColumn(5).width = 28; // Notes

  // --------------------------------------------------------------------------
  // 2. HOJA EGRESOS
  // --------------------------------------------------------------------------
  if (filteredExpenses.length > 0) {
    const wsExpenses = wb.addWorksheet(isEs ? "Egresos" : "Expenses", {
      views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
    });

    // Subtitle / Info bar
    wsExpenses.mergeCells("A1:F1");
    const expTitle = wsExpenses.getCell("A1");
    expTitle.value = isEs
      ? `DESGLOSE DETALLADO DE EGRESOS (${filteredExpenses.length} REGISTROS) • ${periodLabel}`
      : `DETAILED OUTFLOWS LEDGER (${filteredExpenses.length} RECORDS) • ${periodLabel}`;
    expTitle.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLOR_EXPENSE_FILL } };
    expTitle.alignment = { vertical: "middle", horizontal: "left" };
    wsExpenses.getRow(1).height = 24;

    // Table Headers (Row 3)
    const expHeaders = [
      isEs ? "Fecha" : "Date",
      isEs ? "Concepto / Descripción" : "Description / Concept",
      isEs ? "Categoría" : "Category",
      isEs ? "Medio de Pago" : "Payment Method",
      isEs ? "Monto" : "Amount",
      isEs ? "Moneda" : "Currency",
    ];
    const headerRow = wsExpenses.getRow(3);
    expHeaders.forEach((h, idx) => {
      headerRow.getCell(idx + 1).value = h;
    });
    applyHeaderStyle(headerRow, COLOR_EXPENSE_FILL);

    // Data rows
    let currentExpRow = 4;
    filteredExpenses.forEach((exp, idx) => {
      const r = wsExpenses.getRow(currentExpRow);
      r.height = 20;
      const isOdd = idx % 2 === 1;
      const bg = isOdd ? COLOR_ZEBRA_ODD : "FFFFFF";

      const cDate = r.getCell(1);
      cDate.value = formatDateDisplay(exp.date);
      cDate.alignment = { vertical: "middle", horizontal: "center" };

      const cDesc = r.getCell(2);
      cDesc.value = exp.description || (isEs ? "Sin descripción" : "No concept");
      cDesc.alignment = { vertical: "middle", horizontal: "left" };

      const cCat = r.getCell(3);
      cCat.value = translateCategory(exp.category);
      cCat.alignment = { vertical: "middle", horizontal: "center" };

      const cPm = r.getCell(4);
      cPm.value = translatePaymentMethod(exp.payment_method);
      cPm.alignment = { vertical: "middle", horizontal: "center" };

      const cAmt = r.getCell(5);
      cAmt.value = Number(exp.amount) || 0;
      cAmt.numFmt = currencyFormat;
      cAmt.alignment = { vertical: "middle", horizontal: "right" };
      cAmt.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "991B1B" } };

      const cCur = r.getCell(6);
      cCur.value = currencySymbol;
      cCur.alignment = { vertical: "middle", horizontal: "center" };
      cCur.font = { name: FONT_FAMILY, size: 9, color: { argb: "64748B" } };

      [cDate, cDesc, cCat, cPm, cAmt, cCur].forEach((cell) => {
        if (!cell.font) {
          cell.font = { name: FONT_FAMILY, size: 10, color: { argb: "0F172A" } };
        }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.border = BORDER_LIGHT;
      });

      currentExpRow++;
    });

    // Total Row
    const totalRow = wsExpenses.getRow(currentExpRow);
    totalRow.height = 24;
    totalRow.getCell(1).value = isEs ? "TOTAL" : "TOTAL";
    totalRow.getCell(2).value = isEs
      ? `TOTAL EGRESOS DEL PERÍODO (${filteredExpenses.length} transacciones)`
      : `TOTAL OUTFLOWS IN PERIOD (${filteredExpenses.length} transactions)`;
    totalRow.getCell(5).value = { formula: `SUM(E4:E${currentExpRow - 1})`, result: totalExpense };
    totalRow.getCell(5).numFmt = currencyFormat;
    totalRow.getCell(6).value = currencySymbol;

    for (let c = 1; c <= 6; c++) {
      const cell = totalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "991B1B" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL_FILL } };
      cell.border = {
        top: { style: "thin", color: { argb: "475569" } },
        bottom: { style: "double", color: { argb: "475569" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };
      if (c === 5) cell.alignment = { vertical: "middle", horizontal: "right" };
      else if (c === 6 || c === 1) cell.alignment = { vertical: "middle", horizontal: "center" };
      else cell.alignment = { vertical: "middle", horizontal: "left" };
    }

    autoFitColumns(wsExpenses, { 1: 14, 2: 34, 3: 20, 4: 22, 5: 18, 6: 10 });
  }

  // --------------------------------------------------------------------------
  // 3. HOJA INGRESOS
  // --------------------------------------------------------------------------
  if (filteredIncomes.length > 0) {
    const wsIncomes = wb.addWorksheet(isEs ? "Ingresos" : "Incomes", {
      views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
    });

    // Subtitle / Info bar
    wsIncomes.mergeCells("A1:F1");
    const incTitle = wsIncomes.getCell("A1");
    incTitle.value = isEs
      ? `DESGLOSE DETALLADO DE INGRESOS (${filteredIncomes.length} REGISTROS) • ${periodLabel}`
      : `DETAILED INFLOWS LEDGER (${filteredIncomes.length} RECORDS) • ${periodLabel}`;
    incTitle.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLOR_INCOME_FILL } };
    incTitle.alignment = { vertical: "middle", horizontal: "left" };
    wsIncomes.getRow(1).height = 24;

    // Table Headers (Row 3)
    const incHeaders = [
      isEs ? "Fecha" : "Date",
      isEs ? "Concepto / Descripción" : "Description / Concept",
      isEs ? "Origen / Fuente" : "Source",
      isEs ? "Medio de Acreditación" : "Payment Method",
      isEs ? "Monto" : "Amount",
      isEs ? "Moneda" : "Currency",
    ];
    const headerRow = wsIncomes.getRow(3);
    incHeaders.forEach((h, idx) => {
      headerRow.getCell(idx + 1).value = h;
    });
    applyHeaderStyle(headerRow, COLOR_INCOME_FILL);

    // Data rows
    let currentIncRow = 4;
    filteredIncomes.forEach((inc, idx) => {
      const r = wsIncomes.getRow(currentIncRow);
      r.height = 20;
      const isOdd = idx % 2 === 1;
      const bg = isOdd ? COLOR_ZEBRA_ODD : "FFFFFF";

      const cDate = r.getCell(1);
      cDate.value = formatDateDisplay(inc.date);
      cDate.alignment = { vertical: "middle", horizontal: "center" };

      const cDesc = r.getCell(2);
      cDesc.value = inc.description || (isEs ? "Abono a cuenta" : "Deposit");
      cDesc.alignment = { vertical: "middle", horizontal: "left" };

      const cSrc = r.getCell(3);
      cSrc.value = translateSource(inc.source);
      cSrc.alignment = { vertical: "middle", horizontal: "center" };

      const cPm = r.getCell(4);
      cPm.value = translatePaymentMethod(inc.payment_method);
      cPm.alignment = { vertical: "middle", horizontal: "center" };

      const cAmt = r.getCell(5);
      cAmt.value = Number(inc.amount) || 0;
      cAmt.numFmt = currencyFormat;
      cAmt.alignment = { vertical: "middle", horizontal: "right" };
      cAmt.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "047857" } };

      const cCur = r.getCell(6);
      cCur.value = currencySymbol;
      cCur.alignment = { vertical: "middle", horizontal: "center" };
      cCur.font = { name: FONT_FAMILY, size: 9, color: { argb: "64748B" } };

      [cDate, cDesc, cSrc, cPm, cAmt, cCur].forEach((cell) => {
        if (!cell.font) {
          cell.font = { name: FONT_FAMILY, size: 10, color: { argb: "0F172A" } };
        }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.border = BORDER_LIGHT;
      });

      currentIncRow++;
    });

    // Total Row
    const totalRow = wsIncomes.getRow(currentIncRow);
    totalRow.height = 24;
    totalRow.getCell(1).value = isEs ? "TOTAL" : "TOTAL";
    totalRow.getCell(2).value = isEs
      ? `TOTAL INGRESOS DEL PERÍODO (${filteredIncomes.length} transacciones)`
      : `TOTAL INFLOWS IN PERIOD (${filteredIncomes.length} transactions)`;
    totalRow.getCell(5).value = { formula: `SUM(E4:E${currentIncRow - 1})`, result: totalIncome };
    totalRow.getCell(5).numFmt = currencyFormat;
    totalRow.getCell(6).value = currencySymbol;

    for (let c = 1; c <= 6; c++) {
      const cell = totalRow.getCell(c);
      cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "065F46" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL_FILL } };
      cell.border = {
        top: { style: "thin", color: { argb: "475569" } },
        bottom: { style: "double", color: { argb: "475569" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };
      if (c === 5) cell.alignment = { vertical: "middle", horizontal: "right" };
      else if (c === 6 || c === 1) cell.alignment = { vertical: "middle", horizontal: "center" };
      else cell.alignment = { vertical: "middle", horizontal: "left" };
    }

    autoFitColumns(wsIncomes, { 1: 14, 2: 34, 3: 20, 4: 22, 5: 18, 6: 10 });
  }

  // --------------------------------------------------------------------------
  // 4. HOJA METAS
  // --------------------------------------------------------------------------
  if (goals.length > 0) {
    const wsGoals = wb.addWorksheet(isEs ? "Metas" : "Goals", {
      views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
    });

    wsGoals.mergeCells("A1:G1");
    const goalTitle = wsGoals.getCell("A1");
    goalTitle.value = isEs
      ? `SEGUIMIENTO DE OBJETIVOS Y METAS FINANCIERAS (${goals.length} METAS ACTIVAS)`
      : `FINANCIAL GOALS & SAVINGS TARGETS TRACKER (${goals.length} ACTIVE GOALS)`;
    goalTitle.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLOR_GOAL_FILL } };
    goalTitle.alignment = { vertical: "middle", horizontal: "left" };
    wsGoals.getRow(1).height = 24;

    const goalHeaders = [
      isEs ? "Objetivo / Meta" : "Goal Target",
      isEs ? "Fondo Actual" : "Current Amount",
      isEs ? "Meta Proyectada" : "Target Cap",
      isEs ? "Progreso (%)" : "Progress (%)",
      isEs ? "Remanente" : "Remaining",
      isEs ? "Estado" : "Status",
      isEs ? "Moneda" : "Currency",
    ];
    const headerRow = wsGoals.getRow(3);
    goalHeaders.forEach((h, idx) => {
      headerRow.getCell(idx + 1).value = h;
    });
    applyHeaderStyle(headerRow, COLOR_GOAL_FILL);

    let currentGoalRow = 4;
    goals.forEach((g, idx) => {
      const r = wsGoals.getRow(currentGoalRow);
      r.height = 20;
      const isOdd = idx % 2 === 1;
      const bg = isOdd ? COLOR_ZEBRA_ODD : "FFFFFF";

      const pct = g.target_amount > 0 ? g.current_amount / g.target_amount : 0;
      const rem = Math.max(0, g.target_amount - g.current_amount);
      const isDone = g.current_amount >= g.target_amount;

      const cName = r.getCell(1);
      cName.value = g.name;
      cName.alignment = { vertical: "middle", horizontal: "left" };
      cName.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: "0F172A" } };

      const cCur = r.getCell(2);
      cCur.value = Number(g.current_amount) || 0;
      cCur.numFmt = currencyFormat;
      cCur.alignment = { vertical: "middle", horizontal: "right" };

      const cTgt = r.getCell(3);
      cTgt.value = Number(g.target_amount) || 0;
      cTgt.numFmt = currencyFormat;
      cTgt.alignment = { vertical: "middle", horizontal: "right" };

      const cPct = r.getCell(4);
      cPct.value = pct;
      cPct.numFmt = "0.0%";
      cPct.alignment = { vertical: "middle", horizontal: "center" };
      cPct.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: isDone ? "047857" : "3730A3" } };

      const cRem = r.getCell(5);
      cRem.value = rem;
      cRem.numFmt = currencyFormat;
      cRem.alignment = { vertical: "middle", horizontal: "right" };

      const cStatus = r.getCell(6);
      cStatus.value = isDone
        ? (isEs ? "✓ CUMPLIDA" : "✓ COMPLETED")
        : (isEs ? "EN PROGRESO" : "IN PROGRESS");
      cStatus.alignment = { vertical: "middle", horizontal: "center" };
      cStatus.font = {
        name: FONT_FAMILY,
        size: 9,
        bold: true,
        color: { argb: isDone ? "166534" : "92400E" },
      };
      cStatus.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isDone ? "DCFCE7" : "FEF3C7" },
      };

      const cCurrency = r.getCell(7);
      cCurrency.value = currencySymbol;
      cCurrency.alignment = { vertical: "middle", horizontal: "center" };
      cCurrency.font = { name: FONT_FAMILY, size: 9, color: { argb: "64748B" } };

      [cName, cCur, cTgt, cPct, cRem, cCurrency].forEach((cell) => {
        if (!cell.font) {
          cell.font = { name: FONT_FAMILY, size: 10, color: { argb: "0F172A" } };
        }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.border = BORDER_LIGHT;
      });
      cStatus.border = BORDER_LIGHT;

      currentGoalRow++;
    });

    autoFitColumns(wsGoals, { 1: 28, 2: 18, 3: 18, 4: 14, 5: 18, 6: 18, 7: 10 });
  }

  // Generate and trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `FinTrack-Reporte-${reportReference}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
