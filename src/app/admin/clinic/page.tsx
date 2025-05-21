"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Loading from "@/components/loading";
import { getPaginatedClinics } from "@/lib/supabase/functions/get-paginated-clinics";

export default function ClinicPage() {
  const searchParams = useSearchParams();
  const { page, limit, filters } = validateClinicQueryParams(searchParams);

  const { isError, error, data, isLoading } = useQuery({
    queryKey: [
      "clinics",
      page,
      limit,
      filters.clinic_name,
      filters.category,
      filters.date_range,
    ],
    queryFn: async () => await getPaginatedClinics(page, limit, filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="container mx-auto py-10">
      {isError && <div className="bg-red-500/20">{error.message}</div>}
      {isLoading && <Loading />}
      {data && <DataTable columns={columns} paginatedData={data} />}
    </div>
  );
}

export function validateClinicQueryParams(
  searchParams: ReadonlyURLSearchParams
) {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const clinicNameParam = searchParams.get("clinic_name");
  const categoryParam = searchParams.get("category");
  const encodedDates = searchParams.get("dates");

  const page = pageParam ? Number(pageParam) : 1;
  const limit =
    limitParam && Number(limitParam) < 1000 ? Number(limitParam) : 10;

  let dateRange: { from?: string; to?: string } = {};

  if (encodedDates) {
    try {
      const decoded = JSON.parse(decodeURIComponent(encodedDates));
      if (decoded?.from) dateRange.from = decoded.from;
      if (decoded?.to) dateRange.to = decoded.to;
    } catch (error) {
      console.error("Invalid dates parameter:", error);
    }
  }

  const filters = {
    clinic_name: clinicNameParam || undefined,
    category:
      categoryParam && categoryParam !== "all" ? categoryParam : undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters };
}
