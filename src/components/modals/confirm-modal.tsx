"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import React from "react";

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string; // Button label for confirm (default: 삭제)
  cancelLabel?: string; // Button label for cancel (default: 취소)
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "삭제", // Delete
  cancelLabel = "취소", // Cancel
  loading = false,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-pretendard-600">{title}</DialogTitle>
          <DialogDescription className="font-pretendard-500">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "삭제 중..." : confirmLabel} {/* Deleting... / Delete */}
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel} {/* Cancel */}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
