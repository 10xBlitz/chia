"use client";

import { useRouter } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useUserStore } from "@/providers/user-store-provider";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { fetchClinicTreatments } from "@/lib/supabase/services/clinic-treatments.service";
import { getDentistQuotations } from "@/lib/supabase/services/quotation.services";

const ITEMS_PER_PAGE = 10;

export default function ViewQuotationPage() {
  const router = useRouter();
  const user = useUserStore((selector) => selector.user);

  //fetch treatments for the clinic
  const { data: treatments, isLoading: clinicTreatmentsLoading } = useQuery({
    queryKey: ["clinic_treatments", user?.clinic_id],
    queryFn: () => fetchClinicTreatments(user?.clinic_id),
    enabled: !!user?.clinic_id,
  });

  //fetch quotations for the clinic using infinite query
  const {
    data: quotationsData,
    isLoading: quotationsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["quotations", user?.clinic_id, user?.clinic?.region, treatments],
    queryFn: ({ pageParam = 1 }) =>
      getDentistQuotations(
        user?.clinic_id as string,
        treatments?.map((t) => t.treatment_id) ?? [],
        pageParam,
        ITEMS_PER_PAGE
      ),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled:
      !!user?.clinic_id &&
      !!user?.clinic?.region &&
      !!treatments &&
      treatments.length > 0,
  });

  // Extract quotation data from paginated response
  const quotations = quotationsData?.pages.flatMap((page) => page.data) || [];

  return (
    <>
      <HeaderWithBackButton title="견적 목록" />
      {(clinicTreatmentsLoading || quotationsLoading) && (
        <div>로딩 중... {/* Loading... */}</div>
      )}

      {quotations.length === 0 && !quotationsLoading && (
        <div className="p-4 text-center text-gray-500">
          견적이 없습니다. {/* No quotations. */}
        </div>
      )}

      {quotations.length > 0 && (
        <div className="flex flex-col pb-10">
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
                  {
                    q.treatment?.treatment_name ||
                      "선택된 치료 없음" /* No treatment selected */
                  }
                  {" · "}
                  {
                    q.clinic_id
                      ? "병원문의" /* Hospital Inquiry */
                      : "공개입찰" /* Public Bidding  */
                  }
                </span>
                <button
                  className={`rounded-md px-4 h-9 font-medium min-w-22 ${
                    q.bid.length > 0
                      ? "border border-gray-200 bg-white text-gray-500"
                      : "bg-blue-600 text-white"
                  }`}
                  tabIndex={-1}
                >
                  {
                    q.bid.length > 0
                      ? "답변완료" // "Response Completed"
                      : "답변하기" // "Reply"
                  }
                </button>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="mt-6 mb-4 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-5 py-2 border-1 border-gray-200  text-black rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {
                  isFetchingNextPage
                    ? "로딩 중..." /* Loading... */
                    : "더 보기" /* Load More */
                }
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Configuration for pagination

// // Helper to fetch quotations for the current clinic, region, or clinic's treatments
// async function fetchQuotations(
//   clinic_id: string | null | undefined,
//   region: string | null | undefined,
//   treatments?: string[],
//   page: number = 1
// ) {
//   if (!clinic_id || !region || treatments?.length === 0 || !treatments)
//     return [];

//   const startIndex = (page - 1) * ITEMS_PER_PAGE;
//   const endIndex = page * ITEMS_PER_PAGE - 1;

//   let query = supabaseClient
//     .from("quotation")
//     .select(
//       `*, treatment(*), bid(*, clinic_treatment!inner(clinic_id, treatment(status))), clinic(status)`
//     )
//     .eq("bid.clinic_treatment.clinic_id", clinic_id)
//     .order("created_at", { ascending: false })
//     .eq("status", "active")
//     .range(startIndex, endIndex);

//   // Properly quote region if it contains a comma
//   // const quotedRegion = region.includes(",") ? `"${region}"` : region;

//   // treatment_id.in.(...) should not have quotes around each id
//   const treatmentsList = treatments.join(",");

//   // This filter retrieves all quotations that are either:
//   //    Private to the clinic, OR
//   //    Public and no treatment, OR
//   //    Public with treatment and matching any of the clinic’s treatments.
//   const filter = [
//     `clinic_id.eq.${clinic_id}`,
//     `and(clinic_id.is.null,treatment_id.is.null)`,
//     `and(clinic_id.is.null,treatment_id.in.(${treatmentsList}))`,
//   ].join(",");

//   query = query.or(filter);

//   const { data, error } = await query;

//   if (error) throw new Error(error.message);

//   // Filter out quotations with deleted treatments, inactive clinics, or bids with deleted treatments (post-processing)
//   const filteredData =
//     data?.filter((quotation) => {
//       // Check treatment filter: Include if no treatment or treatment is active
//       if (quotation.treatment_id) {
//         if (!quotation.treatment || quotation.treatment.status !== "active") {
//           return false;
//         }
//       }

//       // Check clinic filter: Include if no clinic or clinic is active
//       if (quotation.clinic_id) {
//         if (!quotation.clinic || quotation.clinic.status !== "active") {
//           return false;
//         }
//       }

//       // Check bid treatment filter: Exclude if any bid references a deleted treatment
//       if (quotation.bid && quotation.bid.length > 0) {
//         const hasDeletedBidTreatment = quotation.bid.some((bid) => {
//           if (bid.clinic_treatment) {
//             return (
//               !bid.clinic_treatment.treatment ||
//               bid.clinic_treatment.treatment.status !== "active"
//             );
//           }
//           return false;
//         });

//         if (hasDeletedBidTreatment) {
//           return false;
//         }
//       }

//       return true;
//     }) || [];

//   return filteredData;
// }
