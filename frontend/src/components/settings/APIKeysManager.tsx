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
      toast.error("Ingresa un nombre para la clave");
      return;
    }

    setIsCreating(true);
    const res = await apiKeyService.createKey(newKeyName.trim());
    setIsCreating(false);

    if (res.ok && res.data) {
      toast.success("¡Clave de API creada!");
      setCreatedResult(res.data);
      setIsCreateOpen(false);
      setNewKeyName("");
      fetchKeys();
    } else {
      toast.error(res.error || "No fue posible generar la clave");
    }
  };

  const handleExecuteDelete = async (id: string) => {
    setDeletingId(id);
    const res = await apiKeyService.deleteKey(id);
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (res.ok) {
      toast.success("Clave revocada exitosamente");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      toast.error(res.error || "No se pudo revocar la clave");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Clave copiada");
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
    <div className="space-y-3 w-full max-w-full">
      {/* Clean unified section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound size={15} className="text-blue-500" />
          <span className="text-xs font-bold text-foreground">
            Claves de API
          </span>
          {keys.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground">
              {keys.length}
            </span>
          )}
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="min-h-[40px] sm:min-h-0 sm:h-7 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer touch-manipulation"
        >
          <Plus size={14} />
          <span>Nueva Clave</span>
        </Button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="p-4 text-center bg-secondary/30 dark:bg-card/40 border border-border/50 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-1.5" />
          <p className="text-[11px] text-muted-foreground">Cargando...</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="p-3.5 text-center bg-secondary/20 dark:bg-card/30 border border-border/50 rounded-xl">
          <p className="text-xs text-muted-foreground">
            No tienes claves activas. Usa <strong className="text-foreground">Nueva Clave</strong> para conectar servicios externos.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {keys.map((key) => {
            const isConfirming = confirmDeleteId === key.id;
            const isDeleting = deletingId === key.id;

            return (
              <div
                key={key.id}
                className="p-3 bg-secondary/30 dark:bg-card/50 hover:bg-secondary/50 dark:hover:bg-card border border-border/60 rounded-xl transition-all space-y-2"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground truncate min-w-0">
                    {key.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Activa
                  </span>
                </div>

                {/* Masked Key */}
                <div>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-background border border-border/60 text-slate-700 dark:text-slate-300 w-full block truncate select-all">
                    {key.key_prefix}••••••••••••{key.key_last4}
                  </code>
                </div>

                {/* Footer metadata & Delete */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="flex items-center gap-1 truncate">
                      <Calendar size={11} className="text-slate-500 dark:text-slate-400 shrink-0" />
                      {formatDate(key.created_at)}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <Clock size={11} className="text-slate-500 dark:text-slate-400 shrink-0" />
                      {key.last_used_at ? formatDate(key.last_used_at) : "Sin uso"}
                    </span>
                  </div>

                  {/* Inline Delete action */}
                  <div className="shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleExecuteDelete(key.id)}
                          className="min-h-[38px] sm:min-h-0 px-2.5 py-1.5 sm:py-0.5 rounded-md bg-rose-500 text-white font-bold text-[11px] sm:text-[10px] hover:bg-rose-600 transition-colors flex items-center gap-1 cursor-pointer touch-manipulation"
                        >
                          {isDeleting ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <span>Confirmar</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-w-[38px] min-h-[38px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center touch-manipulation"
                          title="Cancelar"
                          aria-label="Cancelar eliminación"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(key.id)}
                        className="min-w-[38px] min-h-[38px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer flex items-center justify-center touch-manipulation"
                        title="Revocar clave"
                        aria-label="Revocar clave"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
              <KeyRound className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Generar Clave de API</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Asigna un nombre descriptivo para identificar qué integración utilizará esta clave.
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
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-background border border-border/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <p>
                FinTrack generará una clave única con prefijo <code>fntk_live_</code>. Por seguridad, solo se mostrará una vez.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-semibold h-8"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={13} className="animate-spin mr-1" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <span>Crear Clave</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Reveal Key Dialog */}
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

          <div className="space-y-3 pt-1">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-500 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Guarda tu clave ahora. Por seguridad, no podrá volver a mostrarse.
              </p>
            </div>

            {/* Key Copy Box */}
            <div className="space-y-1">
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
            <div className="space-y-1 p-2.5 bg-secondary/50 rounded-xl border border-border/70 text-xs">
              <span className="font-bold text-foreground text-[11px] block">
                Uso en cabeceras HTTP:
              </span>
              <div className="space-y-0.5 text-[10px] sm:text-[11px] text-muted-foreground font-mono">
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
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold text-xs h-8 rounded-xl cursor-pointer"
              >
                <span>Listo, cerrar</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
