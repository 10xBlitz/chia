"use client";

export const dynamic = "force-dynamic";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPaginatedBids } from "@/lib/supabase/services/bids.services";
import HeaderWithBackButton from "@/components/header-with-back-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import {
  deleteQuotation,
  getSingleQuotation,
} from "@/lib/supabase/services/quotation.services";
import { QuotationSkeleton } from "./skeleton";
import Image from "next/image";
import { calculateAge } from "@/lib/utils";

// Constants
const PAGE_SIZE = 10; // Number of bids per page

export default function BidsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quotationDetails = searchParams.get("quotation_details") || "";
  const quotationId = params?.quotation_id as string;
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (quotationId) setEnabled(true);
  }, [quotationId]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["bids", quotationId],
      queryFn: async ({ pageParam = 1 }) =>
        getPaginatedBids(pageParam, PAGE_SIZE, { quotation_id: quotationId }),
      getNextPageParam: (lastPage, allPages) =>
        lastPage?.data?.length === PAGE_SIZE ? allPages.length + 1 : undefined,
      enabled: enabled && !!quotationId,
      initialPageParam: 1,
    });

  // Fetch quotation details
  const { data: quotation, isLoading: isQuotationLoading } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => getSingleQuotation(quotationId),
    enabled: !!quotationId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!quotationId) throw new Error("잘못된 요청입니다."); // Invalid request
      return deleteQuotation(quotationId);
    },
    onSuccess: () => {
      toast.success("입찰이 삭제되었습니다."); // Bid deleted
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
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
    if (!quotationId) {
      //error there is no quotation ID
      toast.error("잘못된 요청입니다."); // Invalid request
      return;
    }

    if (allBids.length > 0) {
      toast.error("입찰이 있는 견적서는 수정할 수 없습니다."); // Cannot edit quotation with bids
      return;
    }
    router.push(`/patient/quotation/edit-quotation/${quotationId}`);
  }
  function handleDelete() {
    setShowDeleteModal(true);
  }

  const allBids = data?.pages.flatMap((page) => page.data) || [];
  const isDropdownDisabled = allBids.length > 0;

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton
        title={"입찰 목록" + " > " + quotationDetails}
        rightAction={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className="p-2 rounded hover:bg-gray-100 transition"
                disabled={isDropdownDisabled}
                aria-disabled={isDropdownDisabled}
              >
                <MoreVertical size={22} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={isDropdownDisabled ? undefined : handleEdit}
                className="flex items-center gap-2 cursor-pointer"
                disabled={isDropdownDisabled}
                aria-disabled={isDropdownDisabled}
              >
                <Pencil size={16} className="text-blue-500" />
                수정 {/* Edit */}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={isDropdownDisabled ? undefined : handleDelete}
                className="flex items-center gap-2 cursor-pointer"
                disabled={isDropdownDisabled}
                aria-disabled={isDropdownDisabled}
              >
                <Trash2 size={16} className="text-red-500" />
                삭제 {/* Delete */}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      {/* Public Quotation Biddings */}
      {isLoading && <div>로딩 중... {/* Loading... */}</div>}

      {isQuotationLoading && <QuotationSkeleton />}

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
            생년월일 / 나이 {/* Birthdate / Age */}
          </label>
          <div className="border rounded-lg px-3 py-2 bg-gray-50">
            {quotation?.birthdate ? (
              <>
                {new Date(quotation.birthdate).toLocaleDateString("ko-KR")} (
                {calculateAge(new Date(quotation.birthdate))}세){" "}
                {/* years old */}
              </>
            ) : (
              "-"
            )}
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

      {allBids.length === 0 && (
        <div>입찰이 없습니다. {/* There is no bids. */}</div>
      )}

      {allBids && (
        <div className="flex flex-col gap-3">
          {allBids.map((b) => (
            <div
              key={b.id}
              className="flex text-sm items-center w-full py-1 cursor-pointer"
              style={{ minHeight: 48 }}
              onClick={() =>
                router.push(
                  `/patient/quotation/view-bid/${quotationId}?bid_id=${b.id}`
                )
              }
            >
              <span className="font-bold text-black text-left whitespace-nowrap mr-4">
                {new Date(b.created_at).toLocaleDateString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
              <span className="text-gray-600 truncate flex-1 mr-4 whitespace-nowrap">
                {b.clinic_treatment.clinic?.clinic_name || "치과"}
                {/* Dental Clinic */}
                {" · "}
                {
                  typeof b.expected_price_min === "number" &&
                  typeof b.expected_price_max === "number"
                    ? `최소 ${b.expected_price_min.toLocaleString()}원 ~ 최대 ${b.expected_price_max.toLocaleString()}원`
                    : "가격 미정" /* Price not set */
                }
              </span>
              <Button
                className="rounded-md px-4 h-9 font-medium bg-blue-500 text-white"
                variant="outline"
              >
                상세보기 {/* View Details */}
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Infinite Pagination Controls */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"} {/* Load more */}
          </button>
        </div>
      )}

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
    </div>
  );
}
