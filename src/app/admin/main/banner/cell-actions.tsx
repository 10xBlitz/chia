"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditIcon, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { BannerTable } from "./columns";
import { useQueryClient } from "@tanstack/react-query";
import { deleteBanner } from "@/lib/supabase/services/banner.services";
import {
  deleteFileFromSupabase,
  BANNER_IMAGE_BUCKET,
} from "@/lib/supabase/services/upload-file.services";
import toast from "react-hot-toast";
import { BannerModal } from "./banner-modal";

interface CellActionProps {
  data: BannerTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [selected, setSelected] = useState<BannerTable | undefined>(undefined);
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete image from storage if present
      if (data.image) {
        try {
          await deleteFileFromSupabase(data.image, {
            bucket: BANNER_IMAGE_BUCKET,
          });
        } catch (imgErr) {
          // Ignore image delete error, but log for debugging
          console.warn("Failed to delete banner image:", imgErr);
        }
      }
      await deleteBanner(data.id);
      toast.success("배너가 삭제되었습니다."); // Banner deleted
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message || "삭제 실패");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {selected && (
        <BannerModal
          data={selected}
          open={!!selected}
          onClose={() => setSelected(undefined)}
          onSuccess={() => {
            setSelected(undefined);
            queryClient.invalidateQueries({ queryKey: ["banners"] });
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
            onClick={() => setSelected(data)}
          >
            <EditIcon className="w-4 h-4 mr-2" /> 수정 {/* Edit */}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-500"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" /> 삭제 {/* Delete */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
