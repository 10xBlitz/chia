"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DialogTitle } from "@radix-ui/react-dialog";

interface ModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isLong?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  isOpen,
  onClose,
  isLong,
  children,
}) => {
  const onChange = (open: boolean) => {
    setTimeout(() => (document.body.style.pointerEvents = ""), 100);
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={cn(
          "bg-white flex-col gap-10",
          isLong && "max-h-[80vh] overflow-y-scroll"
        )}
      >
        <DialogTitle>
          <div className="flex items-center justify-center flex-col">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </DialogTitle>

        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
