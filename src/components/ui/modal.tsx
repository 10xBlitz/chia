"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DialogTitle } from "@radix-ui/react-dialog";

interface ModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isLong?: boolean;
  isWide?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  isOpen,
  onClose,
  isLong,
  isWide,
  children,
}) => {
  const onChange = (open: boolean) => {
    setTimeout(() => (document.body.style.pointerEvents = "auto"), 100);
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(e) => {
        onChange(e);
      }}
    >
      <DialogContent
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={cn(
          "bg-white flex-col gap-10",
          isLong && "max-h-[80vh] overflow-y-scroll",
          isWide && "min-w-[80dvw]"
        )}
      >
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-center flex-col">
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
