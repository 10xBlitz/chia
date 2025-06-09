"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/components/back-button";
import { getPaginatedBids } from "@/lib/supabase/services/bids.services";

export default function BidsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quotationDetails = searchParams.get("quotation_details") || "";
  const quotationId = params?.quotation_id as string;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (quotationId) setEnabled(true);
  }, [quotationId]);

  const { data: bids, isLoading } = useQuery({
    queryKey: ["bids", quotationId],
    queryFn: () => getPaginatedBids(1, 100, { quotation_id: quotationId }),
    enabled: enabled && !!quotationId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  return (
    <div className="flex flex-col">
      <header
        className={
          "flex flex-col gap-4 mb-5 font-bold font-pretendard-600 text-lg"
        }
      >
        <BackButton className="-ml-2" />
        <h2 className="font-bold text-xl">견적 {/* Estimates */}</h2>
        <span className="text-sm">
          {`견적 목록 > ${quotationDetails}` /* Quotation List > Details */}
        </span>
      </header>
      {/* Public Quotation Biddings */}
      {isLoading && <div>로딩 중... {/* Loading... */}</div>}
      {bids?.data.length === 0 && (
        <div>입찰이 없습니다. {/* There is no bids. */}</div>
      )}
      {bids && (
        <div className="flex flex-col gap-3">
          {bids.data.map((b) => (
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
                  b.expected_price
                    ? `${b.expected_price.toLocaleString()}원`
                    : "가격 미정" /* Price not set */
                }
              </span>
              <Button
                className="rounded-md px-4 h-9 font-medium btn-primary bg-blue-500 text-white"
                variant="outline"
                onClick={(e) => e.stopPropagation()}
              >
                상세보기 {/* View Details */}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
