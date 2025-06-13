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
import { useSearchParams, ReadonlyURLSearchParams } from "next/navigation";

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

export function validateClinicQueryParams(
  searchParams: ReadonlyURLSearchParams
) {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const page = pageParam ? Number(pageParam) : 1;
  const limit =
    limitParam && Number(limitParam) < 1000 ? Number(limitParam) : 10;

  // Dynamically build filters from all search params except page/limit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (key === "page" || key === "limit") return;
    if (key === "dates") {
      try {
        const decoded = JSON.parse(decodeURIComponent(value));
        if (decoded?.from || decoded?.to) {
          filters["date_range"] = {};
          if (decoded?.from) filters["date_range"].from = decoded.from;
          if (decoded?.to) filters["date_range"].to = decoded.to;
        }
      } catch (error) {
        console.error("Invalid dates parameter:", error);
      }
    } else if (value && value !== "all") {
      filters[key] = value;
    }
  });

  return { page, limit, filters };
}
