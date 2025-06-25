"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditIcon, MoreHorizontal, Trash2Icon } from "lucide-react";
import { setUserDeleted } from "@/lib/supabase/services/users.services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useState } from "react";
import EditBasicInfoModal from "./edit-basic-info-modal";
import { UserColumn } from "./columns";
// import { EditPasswordModal } from "@/components/modals/edit-password-modal";

interface CellActionProps {
  data: UserColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const queryClient = useQueryClient();
  // Mutation for deleting user
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await setUserDeleted(data.id);
    },
    onSuccess: () => {
      toast.success("사용자가 삭제되었습니다."); // User deleted
      setConfirmOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["users"], // Invalidate the users query to refresh the data
      });
    },
    onError: (err) => {
      console.log("Error deleting user:", err);
      toast.error("삭제에 실패했습니다. " + err.message); // Failed to delete
      setConfirmOpen(false);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" className="h-8 w-8 p-0">
            {/* 메뉴 열기 (Open menu) */}
            <span className="sr-only">메뉴 열기</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" /> {/* 수정 (Update) */} 수정
          </DropdownMenuItem>
          {/* <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setEditPasswordOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
             비밀번호 수정 (Edit Password)  비밀번호 수정
          </DropdownMenuItem> */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="text-red-600 cursor-pointer"
          >
            <Trash2Icon className="h-4 w-4 text-red-600" />
            {/* 삭제 (Delete) */} 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditBasicInfoModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={data}
        onSuccess={() => {
          setEditOpen(false);
          queryClient.invalidateQueries({ queryKey: ["users"] });
        }}
      />
      {/* <EditPasswordModal
        open={editPasswordOpen}
        onClose={() => setEditPasswordOpen(false)}
        userData={data}
      /> */}
      <ConfirmModal
        open={confirmOpen}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
        title="사용자 삭제 확인" // Confirm User Deletion
        description="정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." // Are you sure you want to delete this user? This action cannot be undone.
        confirmLabel="삭제"
        cancelLabel="취소"
        loading={deleteMutation.isPending}
        className="max-w-[80dvw]"
      />
    </>
  );
};
