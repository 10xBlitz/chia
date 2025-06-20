"use client";
import { cn } from "@/lib/utils";
import { Star, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteReview } from "@/lib/supabase/services/reviews.services";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "./modals/confirm-modal";

interface ClinicReviewCardProps {
  id: string;
  full_name?: string;
  images?: string[];
  rating?: number | string;
  created_at?: string | Date;
  review?: string;
  hasEditDeleteButtons?: boolean;
  onclick?: () => void;
  deleteSuccessCallback?: () => void;
}

function ClinicReviewCard(props: ClinicReviewCardProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Handle delete confirmation
  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteReview(props.id);
      toast.success("리뷰가 삭제되었습니다."); // Review deleted
      props.deleteSuccessCallback?.();
    } catch (err) {
      toast.error((err as Error)?.message || "리뷰 삭제에 실패했습니다."); // Failed to delete review
    }
  };

  return (
    <>
      <div
        key={props.id}
        className={cn(
          "bg-[#F6FAFF] rounded-xl px-4 py-6 mt-3 relative",
          props.onclick && "cursor-pointer hover:bg-[#F0F5FF]"
        )}
        onClick={props.onclick}
      >
        {/* Edit/Delete buttons (top right) */}
        {props.hasEditDeleteButtons && (
          <div className="absolute top-3 right-4 flex gap-2 z-10">
            <button
              type="button"
              aria-label="Edit review"
              className="p-1 rounded hover:bg-blue-100 transition"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/patient/review/edit-review?review_id=${props.id}`
                );
              }}
            >
              <Pencil size={18} className="text-blue-500" />
            </button>
            <button
              type="button"
              aria-label="Delete review"
              className="p-1 rounded hover:bg-red-100 transition"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={18} className="text-red-500" />
            </button>
          </div>
        )}
        {/* Delete confirmation modal */}

        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-full bg-[#E9EEF3] flex items-center justify-center">
            <span className="text-2xl text-gray-400">
              {/* User icon */}
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" fill="#B0B8C1" />
                <rect
                  x="4"
                  y="16"
                  width="16"
                  height="6"
                  rx="3"
                  fill="#B0B8C1"
                />
              </svg>
            </span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-base">
              {props?.full_name || "김00"}
            </div>
          </div>
        </div>
        {/* Images */}
        {Array.isArray(props.images) && props.images.length > 0 && (
          <div className="flex gap-3 mb-3 flex-wrap">
            {props.images.map((img: string, i: number) => (
              <div
                key={i}
                className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0"
              >
                <Image
                  src={img}
                  alt={`review-img-${i}`}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-500 flex items-center gap-1 font-medium text-base">
            <Star size={18} fill="currentColor" />
            {props.rating || "4.2"}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            {props.created_at
              ? (() => {
                  const d = new Date(props.created_at);
                  return `${d.getFullYear()}. ${
                    d.getMonth() + 1
                  }. ${d.getDate()}`;
                })()
              : ""}
          </span>
        </div>
        <div className="text-[15px] leading-relaxed whitespace-pre-line">
          {props.review}
        </div>
      </div>
      <ConfirmModal
        open={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
        }}
        title="리뷰 삭제" // Delete Review
        description="정말로 이 리뷰를 삭제하시겠습니까?" // Are you sure you want to delete this review?
      />
    </>
  );
}

export default ClinicReviewCard;
