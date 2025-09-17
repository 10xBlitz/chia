"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2Icon, Edit } from "lucide-react";
import { useState } from "react";
import { ReviewTable } from "./columns";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { deleteReview } from "@/lib/supabase/services/reviews.services";
import toast from "react-hot-toast";
import CreateReviewModal from "./create-review-modal";

interface CellActionProps {
  data: ReviewTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  // Check if this review was created by admin (has name field)
  const isAdminCreated = !!data.name;

  // Delete mutation - using hard delete
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await deleteReview(reviewId);
    },
    onSuccess: () => {
      toast.success("리뷰가 삭제되었습니다."); // Review has been deleted.
      queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
      setShowDeleteModal(false);
    },
    onError: (error) => {
      console.error("Delete review error:", error);
      toast.error("리뷰 삭제에 실패했습니다."); // Failed to delete review.
    },
  });

  return (
    <>
      <CreateReviewModal
        editMode={true}
        editData={data}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <ConfirmModal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        title="리뷰 삭제" // Delete Review
        description="이 리뷰를 영구적으로 삭제하시겠습니까? 삭제된 리뷰는 복구할 수 없습니다." // Are you sure you want to permanently delete this review? Deleted reviews cannot be recovered.
        confirmLabel="삭제" // Delete
        loading={deleteMutation.isPending}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">메뉴 열기</span> {/* Open menu */}
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdminCreated && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4" /> 수정 {/* Edit */}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer text-red-600"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2Icon className="h-4 w-4" /> 삭제 {/* Delete */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
