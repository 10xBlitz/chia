// filepath: /Users/dev7/Desktop/real-projects/chia/src/app/admin/clinic/confirm-delete-modal.tsx
import { Modal } from "@/components/ui/modal";
import { Button } from "../ui/button";

export function ConfirmDeleteModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
}) {
  return (
    <Modal
      isOpen={open}
      title={title}
      description={description}
      onClose={onCancel}
    >
      <div className="flex flex-col gap-4 items-center justify-center py-4">
        <div className="flex gap-4 w-full justify-center">
          <Button
            type="button"
            className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
            onClick={onConfirm}
          >
            삭제 {/**Delete */}
          </Button>
          <Button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
            onClick={onCancel}
          >
            취소 {/**Cancel */}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
