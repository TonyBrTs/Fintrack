"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: DeleteConfirmDialogProps) {
  const { translate } = useSettings();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <div className="flex items-center gap-3 text-expense mb-2">
            <div className="p-2 bg-expense/10 rounded-full">
              <AlertTriangle size={24} />
            </div>
            <DialogTitle className="text-xl">
              {translate("expenses.delete")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {translate("expenses.details.deleteConfirm")}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-action hover:bg-action/90 text-white dark:bg-action/10 dark:hover:bg-action/20 dark:text-action px-6 py-3 rounded-xl font-bold transition-all border border-transparent dark:border-action/20 cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
            {translate("expenses.form.cancel")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-expense hover:bg-expense/90 text-white dark:bg-expense/10 dark:hover:bg-expense/20 dark:text-expense px-6 py-3 rounded-xl font-bold transition-all border border-transparent dark:border-expense/20 cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={18} />
            {translate("expenses.delete")}
          </motion.button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
