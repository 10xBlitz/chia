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
import { ClinicEventTable } from "./columns";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ClinicEventModal } from "./clinic-event-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { softDeleteClinicEvent } from "@/lib/supabase/services/clinic-event.services";
import toast from "react-hot-toast";

interface CellActionProps {
  data: ClinicEventTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [selected, setSelected] = useState<ClinicEventTable | undefined>(
    undefined
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();

  // Delete mutation - using soft delete (status-based)
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await softDeleteClinicEvent(eventId);
    },
    onSuccess: () => {
      toast.success("이벤트가 삭제되었습니다."); // Event has been deleted.
      queryClient.invalidateQueries({
        queryKey: ["clinic-events"],
      });
      setShowDeleteModal(false);
    },
    onError: (error) => {
      console.error("Delete event error:", error);
      toast.error("이벤트 삭제에 실패했습니다."); // Failed to delete event.
    },
  });

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

      <ConfirmModal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        title="병원삭제" // Delete Event
        description={`"${data.title}" 삭제되면 복구가 불가능합니다.`} // Are you sure you want to delete this event? Deleted events will be hidden from the list and can be restored later.
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
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setSelected(data);
            }}
          >
            <EditIcon className="h-4 w-4" /> 수정 {/* Update */}
          </DropdownMenuItem>
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
