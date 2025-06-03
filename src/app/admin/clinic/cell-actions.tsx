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
import { ClinicTable } from "./columns";
import { ClinicModal } from "./clinic-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { validateClinicQueryParams } from "./page";

interface CellActionProps {
  data: ClinicTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [selected, setSelected] = useState<ClinicTable | undefined>(undefined);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { page, limit, filters } = validateClinicQueryParams(searchParams);

  return (
    <>
      {selected !== undefined && (
        <ClinicModal
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
              queryKey: [
                "clinics",
                page,
                limit,
                filters.clinic_name,
                filters.category,
                filters.date_range,
              ],
            });
          }}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
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
            <EditIcon className="h-4 w-4" /> Update
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
