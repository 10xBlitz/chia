"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function RemoveFavoriteModal({
  open,
  clinicName,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  clinicName: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="즐겨찾기 삭제" // Remove Favorite
      description="정말로 이 병원을 즐겨찾기에서 삭제하시겠습니까?" // Are you sure you want to remove this clinic from your favorites?
      isOpen={open}
      isLong={false}
      onClose={onCancel}
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="text-center font-semibold text-base">{clinicName}</div>
        <div className="flex w-full gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            취소 {/* Cancel */}
          </Button>
          <Button
            className="bg-red-500 flex-1"
            type="button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "삭제 중..." : "삭제"} {/* Removing... : Remove */}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
