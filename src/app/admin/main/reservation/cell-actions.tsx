"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2Icon } from "lucide-react";
import { ReservationTable } from "./columns";
import { deleteReservation } from "@/lib/supabase/services/reservations.services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmModal } from "@/components/modals/confirm-modal";

interface CellActionProps {
  data: ReservationTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      toast.success("예약이 성공적으로 삭제되었습니다."); // Reservation deleted successfully
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setShowDeleteModal(false);
    },
    onError: (error: Error) => {
      toast.error(`예약 삭제 실패: ${error.message}`); // Failed to delete reservation
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    deleteMutation.mutate(data.id);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <ConfirmModal
        open={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={handleCancelDelete}
        title="예약 삭제" // Delete Reservation
        description="정말로 이 예약을 삭제하시겠습니까? 삭제된 예약은 복구할 수 없습니다." // Are you sure you want to delete this reservation? Deleted reservations cannot be recovered.
        confirmLabel="삭제" // Delete
        cancelLabel="취소" // Cancel
        loading={isDeleting}
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
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <Trash2Icon className="h-4 w-4" />
            삭제 {/* Delete */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
