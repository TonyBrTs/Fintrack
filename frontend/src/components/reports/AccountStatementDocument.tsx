"use client";

import React from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { formatCurrency } from "@/lib/utils";
import type { Expense, Income, Goal } from "@/types/index";
import { ArrowDownRight, ArrowUpRight, ShieldCheck } from "lucide-react";

interface AccountStatementDocumentProps {
  reportReference: string;
  generatedAt: string;
  periodLabel: string;
  user: {
    email?: string | null;
    user_metadata?: { full_name?: string };
  } | null;
  currencySymbol: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  filteredExpenses: Expense[];
  filteredIncomes: Income[];
  goals: Goal[];
  includeSummary: boolean;
  includeExpensesList: boolean;
  includeIncomesList: boolean;
  includeGoals: boolean;
  notes: string;
  formatDateDisplay: (d: Date | string) => string;
  translateCategory: (c?: string) => string;
  translateSource: (s?: string) => string;
  translatePaymentMethod: (p?: string) => string;
  isEs: boolean;
}

export function AccountStatementDocument({
  reportReference,
  generatedAt,
  periodLabel,
  user,
  currencySymbol,
  totalIncome,
  totalExpense,
  netSavings,
  savingsRate,
  filteredExpenses,
  filteredIncomes,
  goals,
  includeSummary,
  includeExpensesList,
  includeIncomesList,
  includeGoals,
  notes,
  formatDateDisplay,
  translateCategory,
  translateSource,
  translatePaymentMethod,
  isEs,
}: AccountStatementDocumentProps) {
  return (
    <div className="rounded-2xl bg-transparent sm:bg-slate-200/60 sm:dark:bg-slate-950/60 p-0 sm:p-6 md:p-10 flex justify-center border-0 sm:border border-border/60 sm:shadow-inner print:p-0 print:m-0 print:bg-transparent print:border-none print:shadow-none print:rounded-none print:block overflow-hidden">
      {/* Printable Official Financial Document */}
      <div
        id="printable-financial-report"
        className="w-full max-w-[850px] bg-white text-slate-900 border border-slate-300/80 shadow-md sm:shadow-2xl rounded-xl sm:rounded-sm p-3.5 sm:p-8 md:p-12 font-sans text-xs sm:text-sm leading-normal transition-all print:p-0 print:m-0 print:max-w-none print:border-none print:shadow-none print:rounded-none print:w-full"
      >
        {/* Header: Corporate Branding & Technical Audit Box */}
        <div className="report-section pb-4 sm:pb-6 border-b-2 border-slate-400 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <BrandLogo size={28} variant="full" />
              </div>
              <h2 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                {isEs
                  ? "ESTADO DE CUENTA Y RENDICIÓN DE FONDOS"
                  : "CONSOLIDATED FINANCIAL STATEMENT"}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {isEs
                  ? "Informe consolidado de ingresos percibidos, egresos y posiciones de ahorro."
                  : "Consolidated audit report of inflows, expenses, and asset positions."}
              </p>
            </div>

            <div className="sm:text-right bg-slate-50 border border-slate-300/80 rounded p-2 sm:p-3 sm:min-w-[210px] font-mono text-[11px] shadow-2xs">
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">
                {isEs ? "REFERENCIA CONTABLE" : "AUDIT SERIAL REF"}
              </div>
              <div className="font-bold text-slate-900 text-xs tracking-wider">
                {reportReference}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 sm:mt-1">
                {isEs ? `Emisión: ${generatedAt}` : `Issued: ${generatedAt}`}
              </div>
            </div>
          </div>

          {/* Account Holder & Scope Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                {isEs ? "Titular de Cuenta" : "Account Holder"}
              </span>
              <span className="font-semibold text-slate-800 break-words block text-[11px] sm:text-xs">
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  (isEs ? "Titular FinTrack" : "Account Holder")}
              </span>
            </div>
            <div>
              <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                {isEs ? "Período Consultado" : "Consulted Period"}
              </span>
              <span className="font-semibold text-slate-800 break-words block text-[11px] sm:text-xs">
                {periodLabel}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                {isEs ? "Correo Electrónico" : "Email"}
              </span>
              <span className="font-mono text-slate-700 break-words block text-[10px] sm:text-xs">
                {user?.email || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Statement of Operations (Summary) */}
        {includeSummary && (
          <div className="report-section mb-6 sm:mb-7">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
              <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                {isEs ? "I. RESUMEN EJECUTIVO Y FLUJO NETO" : "I. EXECUTIVE SUMMARY & NET FLOW"}
              </h3>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate max-w-[140px] sm:max-w-none text-right">
                {periodLabel}
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-[11px] sm:text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] uppercase font-bold border-y border-slate-300">
                    <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left">
                      {isEs ? "Concepto Contable" : "Ledger Concept"}
                    </th>
                    <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center w-14 sm:w-28">
                      {isEs ? "Oper." : "Tx Count"}
                    </th>
                    <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-right w-24 sm:w-40 whitespace-nowrap">
                      {isEs ? "Importe" : "Amount"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-2 sm:px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <ArrowDownRight size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {isEs ? "(+) Total Ingresos" : "(+) Gross Incomes"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:px-3 text-center font-mono text-slate-600">
                      {filteredIncomes.length}
                    </td>
                    <td className="py-2 px-2 sm:px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      +{currencySymbol}
                      {formatCurrency(totalIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <ArrowUpRight size={13} className="text-rose-600 shrink-0" />
                        <span className="truncate">
                          {isEs ? "(-) Total Egresos" : "(-) Gross Outflows"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 sm:px-3 text-center font-mono text-slate-600">
                      {filteredExpenses.length}
                    </td>
                    <td className="py-2 px-2 sm:px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                      -{currencySymbol}
                      {formatCurrency(totalExpense)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-b-2 border-slate-400 bg-slate-50 font-bold">
                    <td className="py-2 px-2 sm:px-3 text-slate-900 uppercase">
                      {isEs ? "(=) Balance Neto" : "(=) Net Balance"}
                    </td>
                    <td className="py-2 px-1 sm:px-3 text-center font-mono text-[10px] sm:text-[11px] text-slate-600 whitespace-nowrap">
                      {savingsRate.toFixed(1)}%
                    </td>
                    <td
                      className={`py-2 px-2 sm:px-3 text-right font-mono text-xs sm:text-sm whitespace-nowrap ${
                        netSavings >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {netSavings < 0
                        ? `-${currencySymbol}${formatCurrency(Math.abs(netSavings))}`
                        : `+${currencySymbol}${formatCurrency(netSavings)}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 2. Itemized Individual Expenses */}
        {includeExpensesList && (
          <div className="report-section mb-6 sm:mb-7">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
              <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                {isEs ? "II. DETALLE DESGLOSADO DE EGRESOS" : "II. ITEMIZED EXPENSES LEDGER"}
              </h3>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                {filteredExpenses.length} {isEs ? "transacciones" : "transactions"}
              </span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="py-3 text-center border border-dashed border-slate-300 rounded text-slate-500 text-xs">
                {isEs
                  ? "No se registran operaciones de egreso en el período seleccionado."
                  : "No expense records registered in this consulted period."}
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-[11px] sm:text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] uppercase font-bold border-y border-slate-300">
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left w-16 sm:w-24">
                        {isEs ? "Fecha" : "Date"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left">
                        {isEs ? "Concepto" : "Concept"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left w-28 hidden sm:table-cell print:table-cell">
                        {isEs ? "Categoría" : "Category"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left w-28 hidden md:table-cell print:table-cell">
                        {isEs ? "Medio Pago" : "Method"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-right w-22 sm:w-28">
                        {isEs ? "Importe" : "Amount"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredExpenses.map((exp, idx) => (
                      <tr
                        key={exp.id || idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <td className="py-2 px-2 sm:px-3 font-mono text-slate-600 whitespace-nowrap text-[10px] sm:text-xs align-top sm:align-middle">
                          {formatDateDisplay(exp.date)}
                        </td>
                        <td className="py-2 px-2 sm:px-3 align-top sm:align-middle">
                          <div className="font-medium text-slate-800 leading-tight text-[11px] sm:text-xs">
                            {exp.description || (isEs ? "Sin descripción" : "No concept")}
                          </div>
                          {/* Mobile-only tags for Category & Payment Method */}
                          <div className="sm:hidden flex flex-wrap items-center gap-1 mt-1">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {translateCategory(exp.category)}
                            </span>
                            {exp.payment_method && (
                              <span className="text-[9px] text-slate-400">
                                • {translatePaymentMethod(exp.payment_method)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-slate-600 hidden sm:table-cell print:table-cell align-middle">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {translateCategory(exp.category)}
                          </span>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-slate-500 text-[11px] hidden md:table-cell print:table-cell align-middle">
                          {translatePaymentMethod(exp.payment_method)}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-right font-mono font-semibold text-rose-700 whitespace-nowrap text-[11px] sm:text-xs align-top sm:align-middle">
                          -{currencySymbol}
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-b-2 border-slate-400 font-bold bg-slate-50">
                      <td
                        colSpan={2}
                        className="py-2 sm:py-2.5 px-2 sm:px-3 text-slate-900 uppercase font-black text-[11px] sm:text-xs"
                      >
                        {isEs
                          ? `Total Egresos (${filteredExpenses.length})`
                          : `Total Expenses (${filteredExpenses.length})`}
                      </td>
                      <td className="hidden sm:table-cell print:table-cell"></td>
                      <td className="hidden md:table-cell print:table-cell"></td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right font-mono text-rose-700 text-[11px] sm:text-xs font-black whitespace-nowrap">
                        -{currencySymbol}
                        {formatCurrency(totalExpense)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Itemized Individual Incomes */}
        {includeIncomesList && (
          <div className="report-section mb-6 sm:mb-7">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
              <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                {isEs ? "III. DETALLE DESGLOSADO DE INGRESOS" : "III. ITEMIZED INCOMES LEDGER"}
              </h3>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                {filteredIncomes.length} {isEs ? "transacciones" : "transactions"}
              </span>
            </div>

            {filteredIncomes.length === 0 ? (
              <div className="py-3 text-center border border-dashed border-slate-300 rounded text-slate-500 text-xs">
                {isEs
                  ? "No se registran abonos o ingresos en el período seleccionado."
                  : "No income records registered in this consulted period."}
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-[11px] sm:text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] uppercase font-bold border-y border-slate-300">
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left w-16 sm:w-24">
                        {isEs ? "Fecha" : "Date"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left">
                        {isEs ? "Concepto" : "Concept"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left w-28 hidden sm:table-cell print:table-cell">
                        {isEs ? "Origen / Fuente" : "Source"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left w-28 hidden md:table-cell print:table-cell">
                        {isEs ? "Medio Acreditación" : "Method"}
                      </th>
                      <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-right w-22 sm:w-28">
                        {isEs ? "Importe" : "Amount"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredIncomes.map((inc, idx) => (
                      <tr
                        key={inc.id || idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <td className="py-2 px-2 sm:px-3 font-mono text-slate-600 whitespace-nowrap text-[10px] sm:text-xs align-top sm:align-middle">
                          {formatDateDisplay(inc.date)}
                        </td>
                        <td className="py-2 px-2 sm:px-3 align-top sm:align-middle">
                          <div className="font-medium text-slate-800 leading-tight text-[11px] sm:text-xs">
                            {inc.description || (isEs ? "Abono a cuenta" : "Deposit")}
                          </div>
                          {/* Mobile-only tags for Source & Method */}
                          <div className="sm:hidden flex flex-wrap items-center gap-1 mt-1">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800">
                              {translateSource(inc.source)}
                            </span>
                            {inc.payment_method && (
                              <span className="text-[9px] text-slate-400">
                                • {translatePaymentMethod(inc.payment_method)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-slate-600 hidden sm:table-cell print:table-cell align-middle">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            {translateSource(inc.source)}
                          </span>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-slate-500 text-[11px] hidden md:table-cell print:table-cell align-middle">
                          {translatePaymentMethod(inc.payment_method)}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap text-[11px] sm:text-xs align-top sm:align-middle">
                          +{currencySymbol}
                          {formatCurrency(inc.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-b-2 border-slate-400 font-bold bg-slate-50">
                      <td
                        colSpan={2}
                        className="py-2 sm:py-2.5 px-2 sm:px-3 text-slate-900 uppercase font-black text-[11px] sm:text-xs"
                      >
                        {isEs
                          ? `Total Ingresos (${filteredIncomes.length})`
                          : `Total Inflows (${filteredIncomes.length})`}
                      </td>
                      <td className="hidden sm:table-cell print:table-cell"></td>
                      <td className="hidden md:table-cell print:table-cell"></td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right font-mono text-emerald-700 text-[11px] sm:text-xs font-black whitespace-nowrap">
                        +{currencySymbol}
                        {formatCurrency(totalIncome)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. Capital Goals Balance Sheet */}
        {includeGoals && goals.length > 0 && (
          <div className="report-section mb-6 sm:mb-7">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
              <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                {isEs ? "IV. BALANCE DE METAS DE AHORRO" : "IV. CAPITAL GOALS STATUS"}
              </h3>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                {goals.length} {isEs ? "metas registradas" : "recorded goals"}
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-[11px] sm:text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] uppercase font-bold border-y border-slate-300">
                    <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-left">
                      {isEs ? "Objetivo / Meta" : "Goal Target"}
                    </th>
                    <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-right hidden sm:table-cell print:table-cell">
                      {isEs ? "Fondo Actual" : "Current Fund"}
                    </th>
                    <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-right hidden sm:table-cell print:table-cell">
                      {isEs ? "Meta Proyectada" : "Target Cap"}
                    </th>
                    <th className="py-1.5 sm:py-2 px-1 sm:px-3 text-center w-20 sm:w-28">
                      {isEs ? "Progreso" : "Status"}
                    </th>
                    <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-right w-22 sm:w-28">
                      {isEs ? "Remanente" : "Remaining"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {goals.map((g, idx) => {
                    const pct =
                      g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                    const rem = Math.max(0, g.target_amount - g.current_amount);
                    const isDone = g.current_amount >= g.target_amount;
                    return (
                      <tr
                        key={g.id || idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <td className="py-2 px-2 sm:px-3 font-semibold text-slate-800 align-top sm:align-middle">
                          <div className="text-[11px] sm:text-xs">{g.name}</div>
                          {/* Mobile-only ratio display */}
                          <div className="sm:hidden text-[9px] font-mono text-slate-500 font-normal mt-0.5">
                            {currencySymbol}
                            {formatCurrency(g.current_amount)} / {currencySymbol}
                            {formatCurrency(g.target_amount)}
                          </div>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-right font-mono font-bold text-slate-900 hidden sm:table-cell print:table-cell align-middle">
                          {currencySymbol}
                          {formatCurrency(g.current_amount)}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-right font-mono text-slate-600 hidden sm:table-cell print:table-cell align-middle">
                          {currencySymbol}
                          {formatCurrency(g.target_amount)}
                        </td>
                        <td className="py-2 px-1 sm:px-3 text-center align-top sm:align-middle">
                          {isDone ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                              {isEs ? "100% CUMPLIDA" : "COMPLETED"}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-700 font-bold text-[10px] sm:text-[11px] whitespace-nowrap">
                              {pct.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-right font-mono text-slate-500 whitespace-nowrap text-[10px] sm:text-xs align-top sm:align-middle">
                          {rem > 0 ? `${currencySymbol}${formatCurrency(rem)}` : "---"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Observations & Remarks */}
        {notes.trim() && (
          <div className="report-section mb-6 sm:mb-7 p-3 sm:p-3.5 bg-slate-50 border-l-4 border-blue-600 text-xs">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] sm:text-[11px] mb-1">
              {isEs ? "V. OBSERVACIONES Y NOTAS ACLARATORIAS" : "V. AUDITOR REMARKS & DISCLOSURES"}
            </div>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[11px] sm:text-xs">
              {notes}
            </p>
          </div>
        )}

        {/* Official Certification Footer */}
        <div className="report-section pt-4 mt-6 sm:mt-8 border-t border-slate-300 text-slate-500 text-[10px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
            <div className="space-y-1 max-w-md">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px] sm:text-[10px]">
                {isEs
                  ? "Certificación de Movimientos y Rendición de Cuentas"
                  : "Statement Certification & Integrity"}
              </p>
              <p className="leading-relaxed text-slate-500 text-[9px] sm:text-[10px]">
                {isEs
                  ? "Este estado de cuenta ha sido consolidado de forma automatizada a partir de los registros provistos por el titular en la plataforma FinTrack. Documento privado para uso exclusivo de control contable y patrimonial."
                  : "This financial statement has been consolidated automatically from records provided by the account holder in FinTrack. Private document for accounting and asset management purposes."}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <div className="flex items-center justify-start sm:justify-end gap-1 text-slate-700 font-bold mb-1">
                <ShieldCheck size={14} className="text-blue-600" />
                <span>{isEs ? "DOCUMENTO CERTIFICADO" : "CERTIFIED REPORT"}</span>
              </div>
              <p className="text-[9px] text-slate-500">
                REF: {reportReference} • {isEs ? "EMISIÓN:" : "ISSUED:"} {generatedAt}
              </p>
              <p className="text-[9px] text-slate-500">FinTrack Systems © 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
