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
import { useSearchParams } from "next/navigation";
import { validateTreatmentQueryParams } from "./page";
import { TreatmentModal } from "./treatment-modal";
import { TreatmentTable } from "./columns";
import { ConfirmDeleteModal } from "@/components/confirm-modal";
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
        title="Delete Treatment"
        description={`Are you sure you want to delete treatment "${data.treatment_name}"?`}
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
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteMutation.status === "pending"}
          >
            <Trash2Icon className="w-4 h-4" />{" "}
            {deleteMutation.status === "pending" ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
