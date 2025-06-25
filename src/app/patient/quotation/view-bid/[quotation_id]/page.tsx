"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { getSingleBid } from "@/lib/supabase/services/bids.services";
import {
  deleteQuotation,
  getSingleQuotation,
} from "@/lib/supabase/services/quotation.services";
import { BidSkeleton, QuotationSkeleton } from "./skeleton";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { ConfirmModal } from "@/components/modals/confirm-modal";

// Fetch quotation details

export default function ViewBidPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const bidId = searchParams.get("bid_id") as string;
  const quotationId = params?.quotation_id as string;

  // Fetch quotation details
  const { data: quotation, isLoading: isQuotationLoading } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => getSingleQuotation(quotationId),
    enabled: !!quotationId,
  });

  const { data: bid, isLoading: isBidsLoading } = useQuery({
    queryKey: ["bid", bidId],
    queryFn: () => getSingleBid(bidId),
    enabled: !!bidId && bidId !== "null" && !!quotationId,
  });

  const clinicName = quotation?.clinic
    ? quotation.clinic.clinic_name
    : bid?.clinic_treatment.clinic.clinic_name;

  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!bidId) throw new Error("잘못된 요청입니다."); // Invalid request
      return deleteQuotation(quotationId);
    },
    onSuccess: () => {
      toast.success("입찰이 삭제되었습니다."); // Bid deleted
      setShowDeleteModal(false);
      queryClient.invalidateQueries();
      router.back();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "삭제에 실패했습니다."; // Delete failed
      toast.error(message);
      setShowDeleteModal(false);
    },
  });

  function handleEdit() {
    if (!bidId) return;
    router.push(`/patient/quotation/edit-quotation/${quotationId}`);
  }
  function handleDelete() {
    setShowDeleteModal(true);
  }

  // Disable edit/delete if a bid is already associated with the quotation
  const isBidAssociated = !!bid;

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton
        title={"견적서" + " > " + clinicName}
        rightAction={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className="p-2 rounded hover:bg-gray-100 transition"
                disabled={isBidAssociated}
                aria-disabled={isBidAssociated}
              >
                <MoreVertical size={22} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={isBidAssociated ? undefined : handleEdit}
                className="flex items-center gap-2 cursor-pointer"
                disabled={isBidAssociated}
                aria-disabled={isBidAssociated}
              >
                <Pencil size={16} className="text-blue-500" />
                수정 {/* Edit */}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={isBidAssociated ? undefined : handleDelete}
                className="flex items-center gap-2 cursor-pointer"
                disabled={isBidAssociated}
                aria-disabled={isBidAssociated}
              >
                <Trash2 size={16} className="text-red-500" />
                삭제 {/* Delete */}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <ConfirmModal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="입찰 삭제 확인" // Confirm Bid Delete
        description="정말로 이 입찰을 삭제하시겠습니까?" // Are you sure you want to delete this bid?
        confirmLabel="삭제" // Delete
        cancelLabel="취소" // Cancel
        loading={deleteMutation.isPending}
      />
      {/* Quotation */}
      {isQuotationLoading && <QuotationSkeleton />}
      {isBidsLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BidSkeleton key={i} />
          ))}
        </div>
      )}
      <div className="mb-6">
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">
            시술 종류 {/* Treatment Type */}
          </label>
          <div className="border rounded-lg px-3 py-2 bg-gray-50">
            {quotation?.treatment?.treatment_name || "-"}
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">
            지역 {/* Region */}
          </label>
          <div className="border rounded-lg px-3 py-2 bg-gray-50">
            {quotation?.region?.split(",")[1]?.trim() ||
              quotation?.region ||
              "-"}
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">
            고민사항(선택) {/* Concern (Optional) */}
          </label>
          <div className="border rounded-lg px-3 py-2 bg-gray-50 min-h-[56px]">
            {quotation?.concern || ""}
            <div className="text-xs text-gray-400 text-right">
              {quotation?.concern?.length || 0}/300
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">
            사진 첨부(선택) {/* Photo Attachment (Optional) */}
          </label>
          <div className="flex gap-2 flex-wrap">
            {quotation?.image_url && quotation.image_url.length > 0 ? (
              quotation.image_url.map((src: string, idx: number) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-lg overflow-hidden"
                >
                  <Image
                    src={src}
                    alt={`quotation-img-${idx}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400">없음 {/* None */}</div>
            )}
          </div>
        </div>
      </div>
      {/* Bid Info (bottom part) */}
      <div className="border-t pt-6 mt-2">
        <div className="font-semibold mb-3">
          답변
          {/* Answer */}
        </div>
        <div className="mb-2">
          <span className="block text-xs text-gray-500 mb-1">
            병원명 {/* Clinic Name */}
          </span>
          <div>{clinicName}</div>
        </div>
        <div className="mb-2">
          <span className="block text-xs text-gray-500 mb-1">
            추천 시술 {/* Recommended Treatment */}
          </span>
          <div>{bid?.clinic_treatment?.treatment?.treatment_name || "-"}</div>
        </div>
        <div className="mb-2">
          <span className="block text-xs text-gray-500 mb-1">
            예상 견적 {/* Estimated Price */}
          </span>
          <div>
            {typeof bid?.expected_price_min === "number" &&
            typeof bid?.expected_price_max === "number"
              ? `최소 ${bid.expected_price_min.toLocaleString()}원 ~ 최대 ${bid.expected_price_max.toLocaleString()}원`
              : "-"}
          </div>
        </div>
        <div className="mb-2">
          <span className="block text-xs text-gray-500 mb-1">
            추가 설명 {/* Additional Explanation */}
          </span>
          <div className="border rounded-lg px-3 py-2 bg-gray-50 min-h-[56px]">
            {bid?.additional_explanation || ""}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={!!bid?.recommend_quick_visit}
            readOnly
            className="accent-blue-600"
          />
          <span className="text-sm">
            빠른 내원 추천 {/* Recommend Quick Visit */}
          </span>
        </div>
      </div>
      {/* Contact Button */}
      <div className="py-6">
        <Button className="w-full btn-primary text-white" disabled>
          연락하기 {/* Contact */}
        </Button>
      </div>
    </div>
  );
}
