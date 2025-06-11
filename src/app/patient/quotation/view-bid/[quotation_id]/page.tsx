"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { getSingleBid } from "@/lib/supabase/services/bids.services";
import { getSingleQuotation } from "@/lib/supabase/services/quotation.services";

// Fetch quotation details

export default function ViewBidPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const bidId = searchParams.get("bid_id") as string;
  const quotationId = params?.quotation_id as string;

  const { data: bid, isLoading } = useQuery({
    queryKey: ["bid", bidId],
    queryFn: () => getSingleBid(bidId),
    enabled: !!bidId && bidId !== "null" && !!quotationId,
  });

  // Fetch quotation details
  const { data: quotation } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => getSingleQuotation(quotationId),
    enabled: !!quotationId,
  });

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="공개 견적서" /> {/* Public Quotation */}
      {isLoading && <div>로딩 중... {/* Loading... */}</div>}
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
        <div className="font-semibold mb-3">답변 {/* Answer */}</div>
        <div className="mb-2">
          <span className="block text-xs text-gray-500 mb-1">
            병원명 {/* Clinic Name */}
          </span>
          <div>{bid?.clinic_treatment?.clinic?.clinic_name || "-"}</div>
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
            {bid?.expected_price
              ? `최소 ${bid.expected_price.toLocaleString()}원`
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
