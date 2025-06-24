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
import { TreatmentModal } from "./treatment-modal";
import { TreatmentTable } from "./columns";
import { supabaseClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/modals/confirm-modal";
interface CellActionProps {
  data: TreatmentTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [selected, setSelected] = useState<TreatmentTable | undefined>(
    undefined
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();

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
        queryKey: ["treatments"],
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
              queryKey: ["treatments"],
            });
          }}
        />
      )}

      <ConfirmModal
        open={showDeleteModal}
        title="시술 삭제" // (Delete Treatment)
        description={`시술 \"${data.treatment_name}\"을(를) 삭제하시겠습니까?`}
        // 시술 \"{data.treatment_name}\"을(를) 삭제하시겠습니까? (Are you sure you want to delete treatment ...)
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
