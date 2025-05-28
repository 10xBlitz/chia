"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNavigation from "@/app/patient/bottom-navigation";

// Helper to fetch bids for a quotation
async function fetchBids(quotationId: string) {
  const { data, error } = await supabaseClient
    .from("bid")
    .select("*, clinic_treatment(*, clinic(*))")
    .eq("quotation_id", quotationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export default function BidsPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params?.quotation_id as string;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (quotationId) setEnabled(true);
  }, [quotationId]);

  const { data: bids, isLoading } = useQuery({
    queryKey: ["bids", quotationId],
    queryFn: () => fetchBids(quotationId),
    enabled: enabled && !!quotationId,
  });

  return (
    <div className="p-4 relative min-h-screen max-w-[450px] mx-auto">
      <h2 className="font-bold text-xl mb-4">
        견적 답변 목록 {/* Bid List */}
      </h2>
      {isLoading && <div>로딩 중... {/* Loading... */}</div>}

      {bids?.length === 0 && (
        <div>입찰이 없습니다. {/* There is no bids. */}</div>
      )}

      {bids && (
        <div className="flex flex-col gap-3">
          {bids.map((b) => (
            <div
              key={b.id}
              className="flex text-sm items-center w-full py-1 cursor-pointer"
              style={{ minHeight: 48 }}
              onClick={() => router.push(`/patient/quotation/bid/${b.id}`)}
            >
              <span className="font-bold text-black text-left whitespace-nowrap mr-4">
                {new Date(b.created_at).toLocaleDateString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
              <span className="text-gray-600 truncate flex-1 mr-4 whitespace-nowrap">
                {b.clinic_treatment.clinic?.clinic_name || "치과"}{" "}
                {/* Dental Clinic */}
                {" · "}
                {
                  b.expected_price
                    ? `${b.expected_price.toLocaleString()}원`
                    : "가격 미정" /* Price not set */
                }
              </span>
              <Button
                className="rounded-md px-4 h-9 font-medium border border-gray-200 bg-white text-gray-500"
                variant="outline"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
              >
                상세보기 {/* View Details */}
              </Button>
            </div>
          ))}
        </div>
      )}
      <BottomNavigation />
    </div>
  );
}
