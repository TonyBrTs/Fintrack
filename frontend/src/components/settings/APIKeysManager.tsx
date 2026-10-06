"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Loader2,
  Cpu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiKeyService } from "@/services/apiKeyService";
import type { APIKey, CreateAPIKeyResponse } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";

export function APIKeysManager() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreateAPIKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    const res = await apiKeyService.getKeys();
    if (res.ok && res.data) {
      setKeys(res.data);
    } else {
      toast.error(res.error || "No se pudieron cargar las API Keys");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Por favor ingresa un nombre para la clave");
      return;
    }

    setIsCreating(true);
    const res = await apiKeyService.createKey(newKeyName.trim());
    setIsCreating(false);

    if (res.ok && res.data) {
      toast.success("¡Clave de API generada con éxito!");
      setCreatedResult(res.data);
      setIsCreateOpen(false);
      setNewKeyName("");
      fetchKeys();
    } else {
      toast.error(res.error || "No fue posible generar la clave de API");
    }
  };

  const handleExecuteDelete = async (id: string) => {
    setDeletingId(id);
    const res = await apiKeyService.deleteKey(id);
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (res.ok) {
      toast.success("Clave de API revocada y eliminada");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      toast.error(res.error || "No se pudo revocar la clave");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Clave copiada al portapapeles");
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Nunca";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const apiBase = getApiBaseUrl();

  return (
    <div className="space-y-3.5 w-full max-w-full overflow-hidden">
      {/* Header card optimized for mobile */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Cpu size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground text-xs sm:text-sm">
                Claves de API & Automatizaciones
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 shrink-0">
                Seguro
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Conecta servicios externos, atajos o scripts para registrar gastos automáticamente sin tokens que expiran.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs cursor-pointer"
        >
          <Plus size={15} />
          <span>Generar Nueva Clave</span>
        </Button>
      </div>

      {/* Keys List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Claves Activas ({keys.length})
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 text-center bg-card/40 border border-border/60 rounded-2xl">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Cargando claves de API...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-6 text-center bg-card/40 border border-border/60 rounded-2xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-secondary/80 text-muted-foreground flex items-center justify-center mx-auto">
              <KeyRound size={20} />
            </div>
            <p className="text-xs font-semibold text-foreground">No tienes claves creadas aún</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Crea una clave para conectar automatizaciones externas a tu cuenta.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="mt-1 text-xs font-bold h-8"
            >
              <Plus size={14} />
              <span>Crear mi primera clave</span>
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {keys.map((key) => {
              const isConfirming = confirmDeleteId === key.id;
              const isDeleting = deletingId === key.id;

              return (
                <div
                  key={key.id}
                  className="p-3 sm:p-3.5 bg-card/70 hover:bg-card border border-border/70 rounded-2xl transition-all shadow-xs flex flex-col gap-2.5"
                >
                  {/* Top row: Name, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground truncate min-w-0">
                      {key.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activa
                    </span>
                  </div>

                  {/* Key preview: Masked */}
                  <div className="flex items-center">
                    <code className="text-[11px] font-mono px-2 py-1 rounded-lg bg-secondary/80 dark:bg-slate-900 border border-border/60 text-slate-700 dark:text-slate-300 w-full truncate select-all">
                      {key.key_prefix}••••••••••••{key.key_last4}
                    </code>
                  </div>

                  {/* Bottom row: Dates and Action */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                      <span className="flex items-center gap-1 truncate">
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        {formatDate(key.created_at)}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        {key.last_used_at ? formatDate(key.last_used_at) : "Sin uso"}
                      </span>
                    </div>

                    {/* Inline two-tap delete (No browser alert) */}
                    <div className="shrink-0">
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleExecuteDelete(key.id)}
                            className="px-2 py-1 rounded-lg bg-rose-500 text-white font-bold text-[10px] hover:bg-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {isDeleting ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <span>Revocar</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                            title="Cancelar"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(key.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Revocar clave"
                        >
                          <Trash2 size={13} />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security standard note */}
      <div className="p-2.5 bg-secondary/40 border border-border/50 rounded-xl flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>Cifrado SHA-256 estándar • Claves mostradas una sola vez</span>
        </div>
      </div>

      {/* Modal 1: Create Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
              <KeyRound className="w-5 h-5 text-blue-500 shrink-0" />
              <span>Generar Clave de API</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Asigna un nombre descriptivo para identificar qué integración o servicio externo utilizará esta clave.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateKey} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="apiKeyName" className="text-xs font-bold text-foreground">
                Nombre de la clave
              </label>
              <input
                id="apiKeyName"
                type="text"
                autoFocus
                placeholder="Ej. Automatización de Gastos"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-background border border-border/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck size={15} className="shrink-0 mt-0.5" />
              <p>
                FinTrack generará una clave aleatoria con prefijo <code>fntk_live_</code> con 256 bits de entropía. El servidor solo almacenará su hash criptográfico.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-semibold h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <span>Generar Clave</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Reveal Key Dialog (One-Time Display) */}
      <Dialog
        open={!!createdResult}
        onOpenChange={(open) => {
          if (!open) setCreatedResult(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>¡Clave de API Generada!</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Creada para: <strong>{createdResult?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            {/* Warning Callout */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-[11px] sm:text-xs">Guarda tu clave de API ahora</p>
                <p className="text-[10px] sm:text-[11px] opacity-90 leading-relaxed">
                  Por seguridad, esta clave no se almacena en texto plano y no podrá volver a mostrarse.
                </p>
              </div>
            </div>

            {/* Key Copy Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tu Clave de API Secreta
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-100">
                <code className="text-xs font-mono px-2 py-1 flex-1 break-all select-all text-emerald-400 font-semibold">
                  {createdResult?.plain_key}
                </code>
                <Button
                  size="sm"
                  onClick={() => createdResult && copyToClipboard(createdResult.plain_key)}
                  className={`w-full sm:w-auto shrink-0 text-xs font-bold h-8 px-3 rounded-lg transition-all cursor-pointer ${
                    copied
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="mr-1" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="mr-1" />
                      <span>Copiar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Integration Guide */}
            <div className="space-y-1.5 p-3 bg-secondary/50 rounded-xl border border-border/70 text-xs">
              <span className="font-bold text-foreground text-[11px]">
                Cómo usarla en tus integraciones:
              </span>
              <div className="space-y-1 text-[10px] sm:text-[11px] text-muted-foreground font-mono">
                <p>
                  <strong>Método:</strong> <span className="text-blue-500 font-bold">POST</span>
                </p>
                <p className="break-all">
                  <strong>URL:</strong> {apiBase}/api/expenses
                </p>
                <p className="break-all">
                  <strong>Header:</strong> <code className="text-foreground">X-API-Key: {createdResult?.plain_key}</code>
                </p>
              </div>
            </div>

            <DialogFooter className="pt-1">
              <Button
                onClick={() => setCreatedResult(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold text-xs h-9 rounded-xl cursor-pointer"
              >
                <span>Ya copié mi clave, cerrar</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
