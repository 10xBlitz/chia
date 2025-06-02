"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { EditIcon } from "lucide-react";
import { useUserStore } from "@/providers/user-store-provider";
import BottomNavigation from "../../bottom-navigation";

// Helper to fetch quotations for the current user
async function fetchQuotations(userId: string) {
  const { data, error } = await supabaseClient
    .from("quotation")
    .select("*, treatment(*), bid(*)")
    .eq("patient_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export default function ViewQuotationPage() {
  const router = useRouter();
  const userId = useUserStore((selector) => selector.user?.id as string);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (userId) setEnabled(true);
  }, [userId]);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["quotations", userId],
    queryFn: () => fetchQuotations(userId),
    enabled: enabled && !!userId,
  });

  const handleQuotationClick = (
    quotation_id: string,
    quotation_details: string,
    clinic_id: string | null,
    bid_id: string | null
  ) => {
    if (!clinic_id) {
      //it means it's a public quotation, so redirect to view all bids
      router.push(
        `/patient/quotation/view-bids/${quotation_id}?quotation_details=${quotation_details}`
      );
    } else {
      //it means it's a private quotation (specific to clinic)
      router.push(
        `/patient/quotation/view-bid/${quotation_id}?bid_id=${bid_id}`
      );
    }
  };

  return (
    <>
      <h2 className="font-bold text-xl mb-6">견적 {/* Estimates */}</h2>
      <h2 className="font-bold text-xl mb-4">
        견적 목록 {/* List of Quotes */}
      </h2>
      {isLoading && <div>로딩 중... {/* Loading... */}</div>}

      {quotations?.length === 0 && (
        <div>견적이 없습니다. {/* No quotations. */}</div>
      )}

      {quotations && (
        <div className="flex flex-col gap-3">
          {quotations.map((q) => (
            <div
              key={q.id}
              className="flex text-sm items-center w-full py-1 cursor-pointer"
              style={{ minHeight: 48 }}
              onClick={() => {
                const detail = `${
                  q.region?.split(",")[1]?.trim() || q.region
                } · ${q.treatment.treatment_name} 공개견적`;

                handleQuotationClick(
                  q.id,
                  detail,
                  q?.clinic_id,
                  q.bid?.[0]?.id
                );
              }}
            >
              <span className="font-bold text-black text-left whitespace-nowrap mr-4">
                {new Date(q.created_at).toLocaleDateString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
              <span className="text-gray-600 truncate flex-1 mr-4 whitespace-nowrap">
                {q.region?.split(",")[1]?.trim() || q.region} ·{" "}
                {q.treatment.treatment_name}{" "}
                {
                  q.clinic_id
                    ? "치과" /* Dental Clinic */
                    : "공개견적" /* Public Quotation */
                }
              </span>
              <Button
                className={`rounded-md px-4 h-9 font-medium ${
                  q.bid.length > 0
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-500"
                }`}
                variant={q.bid ? "outline" : "default"}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
              >
                {q.bid.length > 0 ? "답변완료" : "답변 없음"}
                {/* Answered */} {/* No answer */}
                {}
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Floating Button */}
      <Button
        className="fixed bottom-24 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 shadow-lg flex items-center gap-2 transition-all"
        style={{ fontWeight: 500, fontSize: 16 }}
        onClick={() => {
          router.push(`/patient/quotation/create-quotation`);
        }}
      >
        <EditIcon />
        견적서 작성 {/* Create a Quote */}
      </Button>
      <BottomNavigation />
    </>
  );
}
