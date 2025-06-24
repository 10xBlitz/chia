"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditIcon, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { ClinicEventTable } from "./columns";
import { useQueryClient } from "@tanstack/react-query";
import { ClinicEventModal } from "./clinic-event-modal";

interface CellActionProps {
  data: ClinicEventTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [selected, setSelected] = useState<ClinicEventTable | undefined>(
    undefined
  );
  const queryClient = useQueryClient();

  return (
    <>
      {selected !== undefined && (
        <ClinicEventModal
          data={selected}
          open={!!selected}
          onClose={() => {
            setSelected(undefined);
          }}
          onSuccess={() => {
            setTimeout(() => {
              const body = document.querySelector("body");
              if (body) {
                body.style.pointerEvents = "auto";
              }
            }, 500);
            queryClient.invalidateQueries({
              queryKey: ["clinic-events"],
            });
          }}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">메뉴 열기</span> {/* Open menu */}
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setSelected(data);
            }}
          >
            <EditIcon className="h-4 w-4" /> 수정 {/* Update */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
