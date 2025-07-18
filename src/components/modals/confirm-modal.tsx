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
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: React.ReactNode;
  secondDecription?: string; // Optional second description line
  confirmLabel?: string; // Button label for confirm (default: 삭제)
  confirmLoadingLabel?: string; // Optional loading label for confirm button
  cancelLabel?: string; // Button label for cancel (default: 취소)
  confirmButtonClassName?: string; // Optional className for confirm button
  cancelButtonClassName?: string; // Optional className for cancel button
  loading?: boolean;
  className?: string; // Optional className for additional styling
}

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "삭제", // Delete
  confirmLoadingLabel = "삭제 중...", // Deleting...
  confirmButtonClassName = "bg-red-600 text-white hover:bg-red-700",
  cancelButtonClassName = "bg-gray-200 text-gray-800 hover:bg-gray-300",
  cancelLabel = "취소", // Cancel
  loading = false,
  className,
  secondDecription,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent showCloseButton={false} className={cn(className)}>
        <DialogHeader>
          <DialogTitle className="font-pretendard-600 text-md sm:text-xl">
            {title}
          </DialogTitle>
          <DialogDescription className="font-pretendard-500 text-sm">
            {description}
            {secondDecription && (
              <>
                <br />
                {secondDecription}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            className={cn(
              "px-4 py-2 rounded font-semibold",
              confirmButtonClassName
            )}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            disabled={loading}
          >
            {loading ? confirmLoadingLabel : confirmLabel}{" "}
            {/* Deleting... / Delete */}
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
              className={cn(
                "px-4 py-2 rounded font-semibold",
                cancelButtonClassName
              )}
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
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
