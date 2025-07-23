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
import { TreatmentDeleteWarningModal } from "@/components/modals/treatment-delete-warning-modal";
import {
  removeTreatmentImage,
  softDeleteTreatment,
} from "@/lib/supabase/services/treatments.services";
import toast from "react-hot-toast";
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
      await softDeleteTreatment(data.id as string);
      if (data.image_url) await removeTreatmentImage(data.image_url);
    },
    onSuccess: () => {
      setShowDeleteModal(false);

      // there are many querys that need to be invalidated
      // to be safe I just invalidate all queries
      queryClient.invalidateQueries();

      toast.success("시술이 성공적으로 삭제되었습니다."); // Treatment deleted successfully
    },
    onError: () => {
      toast.error("시술 삭제에 실패했습니다."); // Failed to delete treatment
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

      <TreatmentDeleteWarningModal
        open={showDeleteModal}
        treatmentName={data.treatment_name}
        isDeleting={deleteMutation.isPending}
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
