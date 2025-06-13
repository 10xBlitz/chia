"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditIcon, MoreHorizontal, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSearchParams, ReadonlyURLSearchParams } from "next/navigation";
import { TreatmentModal } from "./treatment-modal";
import { TreatmentTable } from "./columns";
import { ConfirmDeleteModal } from "@/components/modals/confirm-modal";
import { supabaseClient } from "@/lib/supabase/client";
interface CellActionProps {
  data: TreatmentTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [selected, setSelected] = useState<TreatmentTable | undefined>(
    undefined
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { page, limit, filters } = validateTreatmentQueryParams(searchParams);

  // Use Tanstack mutation for delete
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseClient
        .from("treatment")
        .update({ status: "deleted" })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setShowDeleteModal(false);
      queryClient.invalidateQueries({
        queryKey: [
          "treatments",
          page,
          limit,
          filters.treatment_name,
          filters.date_range,
        ],
      });
    },
    onError: () => {
      setShowDeleteModal(false);
    },
  });

  return (
    <>
      {selected && (
        <TreatmentModal
          data={selected}
          open={!!selected}
          onClose={() => {
            setSelected(undefined);
            setTimeout(() => {
              const body = document.querySelector("body");
              if (body) {
                body.style.pointerEvents = "auto";
              }
            }, 500);
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
                "treatments",
                page,
                limit,
                filters.treatment_name,
                filters.date_range,
              ],
            });
          }}
        />
      )}

      <ConfirmDeleteModal
        open={showDeleteModal}
        // 시술 삭제 (Delete Treatment)
        title="시술 삭제"
        // 시술 \"{data.treatment_name}\"을(를) 삭제하시겠습니까? (Are you sure you want to delete treatment ...)
        description={`시술 \"${data.treatment_name}\"을(를) 삭제하시겠습니까?`}
        onCancel={() => {
          setTimeout(() => {
            const body = document.querySelector("body");
            if (body) {
              body.style.pointerEvents = "auto";
            }
          }, 500);
          setShowDeleteModal(false);
        }}
        onConfirm={() => {
          deleteMutation.mutate();
          setTimeout(() => {
            const body = document.querySelector("body");
            if (body) {
              body.style.pointerEvents = "auto";
            }
          });
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            {/* 메뉴 열기 (Open menu) */}
            <span className="sr-only">메뉴 열기</span>
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
            <EditIcon className="h-4 w-4" /> {/* 수정 (Update) */} 수정
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteMutation.status === "pending"}
          >
            <Trash2Icon className="w-4 h-4" />{" "}
            {/* 삭제 중... (Deleting...) / 삭제 (Delete) */}
            {deleteMutation.status === "pending" ? "삭제 중..." : "삭제"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export function validateTreatmentQueryParams(
  searchParams: ReadonlyURLSearchParams
) {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const treatmentNameParam = searchParams.get("treatment_name");
  const encodedDates = searchParams.get("dates");

  const page = pageParam ? Number(pageParam) : 1;
  const limit =
    limitParam && Number(limitParam) < 1000 ? Number(limitParam) : 10;

  const dateRange: { from?: string; to?: string } = {};

  if (encodedDates) {
    try {
      const decoded = JSON.parse(decodeURIComponent(encodedDates));
      if (decoded?.from) dateRange.from = decoded.from;
      if (decoded?.to) dateRange.to = decoded.to;
    } catch (error) {
      console.error("Invalid dates parameter:", error);
    }
  }

  const filters = {
    treatment_name: treatmentNameParam || undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters };
}
