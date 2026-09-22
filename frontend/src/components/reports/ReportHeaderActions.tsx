"use client";

import React from "react";
import Link from "next/link";
import {
  Printer,
  FileSpreadsheet,
  FileDown,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";

interface ReportHeaderActionsProps {
  reportReference: string;
  isEs: boolean;
  onPrint: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export function ReportHeaderActions({
  reportReference,
  isEs,
  onPrint,
  onExportExcel,
  onExportCSV,
}: ReportHeaderActionsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/40 print:hidden">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span>{isEs ? "Volver al Dashboard" : "Back to Dashboard"}</span>
          </Link>
          <span className="text-border">/</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <SlidersHorizontal size={10} />
            {isEs ? "Auditoría y Exportación" : "Audit & Export"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-titles dark:text-foreground">
            {isEs ? "Reportes y Estados de Cuenta" : "Financial Statements & Reports"}
          </h1>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
            {reportReference}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {isEs
            ? "Configura el período exacto y exporta en PDF oficial, libro de Excel (.xlsx) o archivo CSV."
            : "Configure exact period and export as certified PDF, Excel spreadsheet (.xlsx), or CSV."}
        </p>
      </div>

      {/* Action Buttons: Print, Excel, CSV */}
      <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition cursor-pointer active:scale-95"
          title={isEs ? "Imprimir o Guardar como PDF" : "Print or Save as PDF"}
        >
          <Printer size={15} />
          <span>{isEs ? "PDF / Imprimir" : "PDF / Print"}</span>
        </button>

        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition cursor-pointer active:scale-95"
          title={isEs ? "Descargar archivo Excel (.xlsx)" : "Download Excel (.xlsx)"}
        >
          <FileSpreadsheet size={15} />
          <span>Excel (.xlsx)</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-accent text-foreground border border-border shadow-xs transition cursor-pointer active:scale-95"
          title={isEs ? "Descargar texto CSV plano" : "Download CSV file"}
        >
          <FileDown size={15} />
          <span>CSV</span>
        </button>
      </div>
    </div>
  );
}
