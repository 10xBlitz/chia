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
import { ClinicTable } from "./columns";
import { ClinicModal } from "./clinic-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { softDeleteClinic } from "@/lib/supabase/services/clinics.services";
import toast from "react-hot-toast";

interface CellActionProps {
  data: ClinicTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [selected, setSelected] = useState<ClinicTable | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();

  // Delete mutation - using soft delete (status-based)
  const deleteMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      await softDeleteClinic(clinicId);
    },
    onSuccess: () => {
      toast.success("병원이 삭제되었습니다."); // Clinic has been deleted.
      queryClient.invalidateQueries({
        queryKey: ["clinics"],
      });

      //there are a lot of queries that need to be invalidated
      //so we can just invalidate all queries
      queryClient.invalidateQueries();

      setShowDeleteModal(false);
    },
    onError: (error) => {
      console.error("Delete clinic error:", error);
      toast.error("병원 삭제에 실패했습니다."); // Failed to delete clinic.
    },
  });

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
              queryKey: ["clinics"],
            });
          }}
        />
      )}

      <ConfirmModal
        open={showDeleteModal}
        onConfirm={() => deleteMutation.mutate(data.id)}
        onCancel={() => setShowDeleteModal(false)}
        title="병원삭제" // Confirm clinic deletion
        description={`"${data.clinic_name}" 삭제되면 복구가 불가능합니다.`}
        confirmLabel="삭제" // Delete
        cancelLabel="취소" // Cancel
        loading={deleteMutation.status === "pending"}
      />

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
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => {
              setShowDeleteModal(true);
            }}
          >
            <Trash2Icon className="h-4 w-4" /> 삭제 {/* Delete */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
