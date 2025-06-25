"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/providers/user-store-provider";
import HeaderWithBackButton from "@/components/header-with-back-button";

export default function ViewQuotationPage() {
  const router = useRouter();
  const user = useUserStore((selector) => selector.user);

  //fetch treatments for the clinic
  const { data: treatments, isLoading: clinicTreatmentsLoading } = useQuery({
    queryKey: ["clinic_treatments", user?.clinic_id],
    queryFn: () => fetchClinicTreatments(user?.clinic_id),
    enabled: !!user?.clinic_id,
  });

  //fetch quotations for the clinic
  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ["quotations", user?.clinic_id, user?.clinic?.region, treatments],
    queryFn: async () =>
      await fetchQuotations(
        user?.clinic_id,
        user?.clinic?.region,
        treatments?.map((t) => t.treatment_id)
      ),
    enabled:
      !!user?.clinic_id &&
      !!user?.clinic?.region &&
      !!treatments &&
      treatments.length > 0,
  });

  return (
    <>
      <HeaderWithBackButton title="견적 목록" />
      {(clinicTreatmentsLoading || quotationsLoading) && (
        <div>로딩 중... {/* Loading... */}</div>
      )}

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
                router.push(`/dentist/quotation/view-bid/${q.id}`);
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
                {q.treatment?.treatment_name || "선택된 치료 없음"}
                {" · "}
                {q.clinic_id ? "사적인" /* Private */ : "공공의" /* Public  */}
              </span>
              <Button
                className={`rounded-md px-4 h-9 font-medium ${
                  q.bid
                    ? "border border-gray-200 bg-white text-gray-500"
                    : "bg-blue-600 text-white"
                }`}
                variant={q.bid ? "outline" : "default"}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
              >
                {
                  q.clinic_id
                    ? "답변완료" /* Answered */
                    : "답변확인" /* Check Answers */
                }
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Helper to fetch quotations for the current clinic, region, or clinic's treatments
async function fetchQuotations(
  clinic_id: string | null | undefined,
  region: string | null | undefined,
  treatments?: string[]
) {
  if (!clinic_id || !region || treatments?.length === 0 || !treatments)
    return [];

  let query = supabaseClient
    .from("quotation")
    .select("*, treatment(*), bid(*)")
    .order("created_at", { ascending: false })
    .eq("status", "active")
    .limit(100);

  // Properly quote region if it contains a comma
  const quotedRegion = region.includes(",") ? `"${region}"` : region;

  // treatment_id.in.(...) should not have quotes around each id
  const treatmentsList = treatments.join(",");

  // This filter retrieves all quotations that are either:
  //    Private to the clinic, OR
  //    Public and no treatment, then match region, OR
  //    Public with treatment and match clinic region and matching any of the clinic’s treatments.
  const filter = [
    `clinic_id.eq.${clinic_id}`,
    `and(clinic_id.is.null,treatment_id.is.null,region.eq.${quotedRegion})`,
    `and(clinic_id.is.null,region.eq.${quotedRegion},treatment_id.in.(${treatmentsList}))`,
  ].join(",");

  console.log("---->filter: ", filter);
  query = query.or(filter);

  const { data, error } = await query;

  console.log("---->data: ", data);

  if (error) throw new Error(error.message);
  return data;
}

// Separate fetch function for clinic treatments
async function fetchClinicTreatments(clinic_id?: string | undefined | null) {
  if (!clinic_id) return [];
  const { data } = await supabaseClient
    .from("clinic_treatment")
    .select("treatment_id")
    .eq("clinic_id", clinic_id);
  return data || [];
}
