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
  ArrowRight,
  ExternalLink,
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

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de revocar la clave "${name}"? Cualquier automatización en n8n que la use dejará de funcionar.`)) {
      return;
    }

    setDeletingId(id);
    const res = await apiKeyService.deleteKey(id);
    setDeletingId(null);

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
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const apiBase = getApiBaseUrl();

  return (
    <div className="space-y-4">
      {/* Header card with n8n badge */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Cpu size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-sm">Claves de API y n8n</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                Automatización
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Conecta n8n, Atajos de iOS, Tasker o scripts para registrar gastos automáticamente sin lidiar con tokens que expiran.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
        >
          <Plus size={15} />
          <span>Nueva Clave</span>
        </Button>
      </div>

      {/* Keys List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Tus Claves Activas ({keys.length})
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-card/40 border border-border/60 rounded-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Cargando claves de API...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center bg-card/40 border border-border/60 rounded-2xl space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 text-muted-foreground flex items-center justify-center mx-auto">
              <KeyRound size={24} />
            </div>
            <p className="text-xs font-semibold text-foreground">No tienes ninguna clave creada aún</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Crea tu primera clave para permitir que n8n o cualquier servicio externo envíe gastos directamente a tu cuenta.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 text-xs font-bold"
            >
              <Plus size={14} />
              <span>Crear mi primera clave</span>
            </Button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-3.5 bg-card/70 hover:bg-card border border-border/70 hover:border-blue-500/40 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground truncate">{key.name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activa
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-secondary/80 dark:bg-slate-900 border border-border/60 text-slate-700 dark:text-slate-300 select-all">
                      {key.key_prefix}••••••••••••{key.key_last4}
                    </code>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      Creada: {formatDate(key.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      Último uso: {key.last_used_at ? formatDate(key.last_used_at) : "Nunca"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === key.id}
                    onClick={() => handleDeleteKey(key.id, key.name)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs font-bold rounded-xl h-8 px-2.5 cursor-pointer"
                    title="Revocar y eliminar clave"
                  >
                    {deletingId === key.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Revocar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security standard info note */}
      <div className="p-3 bg-secondary/40 border border-border/50 rounded-xl flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Cifrado SHA-256 estándar • Las claves se muestran solo al crearse</span>
        </div>
      </div>

      {/* Modal 1: Create Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <KeyRound className="w-5 h-5 text-blue-500" />
              <span>Generar Nueva Clave de API</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Asigna un nombre descriptivo para identificar qué aplicación o workflow de n8n utilizará esta clave.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateKey} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="apiKeyName" className="text-xs font-bold text-foreground">
                Nombre del servicio o workflow
              </label>
              <input
                id="apiKeyName"
                type="text"
                autoFocus
                placeholder="Ej. n8n Automatización de Gastos"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-background border border-border/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <p>
                FinTrack generará una clave aleatoria con prefijo <code>fntk_live_</code> con 256 bits de entropía. El servidor solo almacenará su hash criptográfico.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>¡Clave de API Generada con Éxito!</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Clave creada para: <strong>{createdResult?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Warning Callout */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Guarda tu clave de API en un lugar seguro ahora</p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Por estándares de seguridad, este token secreto no se guardó en texto plano y no podrá volver a mostrarse después de cerrar este diálogo.
                </p>
              </div>
            </div>

            {/* Key Copy Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Tu Clave de API Secreta
              </label>
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-100">
                <code className="text-xs font-mono px-2 py-1 flex-1 break-all select-all text-emerald-400 font-semibold">
                  {createdResult?.plain_key}
                </code>
                <Button
                  size="sm"
                  onClick={() => createdResult && copyToClipboard(createdResult.plain_key)}
                  className={`shrink-0 text-xs font-bold h-8 px-3 rounded-lg transition-all ${
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

            {/* Quick n8n Integration Guide */}
            <div className="space-y-2 p-3 bg-secondary/50 rounded-xl border border-border/70 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span>Cómo usarla en n8n (HTTP Request Node):</span>
              </span>
              <div className="space-y-1 text-[11px] text-muted-foreground font-mono">
                <p>
                  <strong>Método:</strong> <span className="text-blue-500 font-bold">POST</span>
                </p>
                <p className="break-all">
                  <strong>URL:</strong> {apiBase}/api/expenses
                </p>
                <p>
                  <strong>Header:</strong> <code className="text-foreground">X-API-Key: {createdResult?.plain_key}</code>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setCreatedResult(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold text-xs rounded-xl"
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
