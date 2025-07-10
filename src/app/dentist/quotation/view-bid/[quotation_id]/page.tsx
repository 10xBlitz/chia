"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { useUserStore } from "@/providers/user-store-provider";
import { BidAnswerSkeleton } from "@/app/dentist/quotation/view-bid/[quotation_id]/bid-answer-skeleton";
import { calculateAge } from "@/lib/utils";

export default function ViewBidPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params?.quotation_id as string;
  const user = useUserStore((selector) => selector.user);

  // Fetch quotation details
  const { data: quotation } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => fetchQuotation(quotationId),
    enabled: !!quotationId,
  });

  const { data: bid, isLoading } = useQuery({
    queryKey: ["bid", quotation?.id],
    queryFn: () => fetchBid(quotation?.id, user?.clinic_id),
    enabled: !!quotation?.id && !!user?.clinic_id,
    retry: 1,
  });

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton
        title={`${quotation?.name} 님이 요청한 견적이에요.`}
      />{" "}
      {/**This is the quote submitted by 00. */}
      {/* Public Quotation */}
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
      {/* Bid Info (bottom part) */}
      {isLoading ? (
        <BidAnswerSkeleton />
      ) : (
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
      )}
      {/* Contact Button */}
      <div className="py-6 flex gap-3">
        <Button
          className="flex-1 bg-white hover:bg-blue-500 hover:text-white text-black border-1"
          onClick={() => {
            const phone = bid?.clinic_treatment?.clinic?.contact_number;
            if (phone) {
              window.location.href = `tel:${phone}`;
            }
          }}
        >
          전화하기 {/* Contact */}
        </Button>
        <Button
          onClick={() =>
            router.push(`/dentist/quotation/create-bid/${quotationId}`)
          }
          disabled={!!bid?.id}
          className="flex-1 bg-white hover:text-white hover:bg-blue-500 text-black border-1"
        >
          답변하기 {/* Reply */}
        </Button>
      </div>
    </div>
  );
}

// Fetch bid and related data
async function fetchBid(
  quotationId: string | undefined | null,
  clinicId: string | undefined | null
) {
  if (!quotationId || !clinicId) {
    throw new Error("Quotation ID and Clinic ID are required.");
  }
  const { data, error } = await supabaseClient
    .from("bid")
    .select("*, clinic_treatment(*, clinic(*), treatment(*)), quotation(*)")
    .eq("quotation_id", quotationId)
    .eq("clinic_treatment.clinic_id", clinicId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Fetch quotation details
async function fetchQuotation(quotationId: string) {
  const { data, error } = await supabaseClient
    .from("quotation")
    .select("*, treatment(*)")
    .eq("id", quotationId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
