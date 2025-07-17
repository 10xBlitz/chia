"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Loading from "@/components/loading";
import { getPaginatedReservations } from "@/lib/supabase/services/reservations.services";

export default function ReservationPage() {
  const searchParams = useSearchParams();
  const { page, limit, filters } = validateReservationQueryParams(searchParams);

  const { isError, error, data, isLoading } = useQuery({
    queryKey: [
      "reservations",
      page,
      limit,
      filters.full_name,
      filters.category,
      filters.date_range,
    ],
    queryFn: async () => await getPaginatedReservations(page, limit, filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Provide fallback paginatedData for loading state
  const paginatedData = data || {
    data: [],
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  return (
    <div className="p-4">
      {isError && <div className="bg-red-500/20">{error.message}</div>}
      {isLoading && <Loading />}
      <DataTable columns={columns} paginatedData={paginatedData} />
    </div>
  );
}

function validateReservationQueryParams(searchParams: ReadonlyURLSearchParams) {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const fullNameParam = searchParams.get("full_name");
  const categoryParam = searchParams.get("category");
  const encodedDates = searchParams.get("dates");

  const page = pageParam ? Number(pageParam) : 1;
  const limit =
    limitParam && Number(limitParam) < 1000 ? Number(limitParam) : 10;

  const dateRange: { from?: string; to?: string } = {};

  if (encodedDates) {
    try {
      const decoded = JSON.parse(decodeURIComponent(encodedDates));
      if (decoded?.from) dateRange.from = decoded.from;
      if (decoded?.to) dateRange.to = decoded.to;
    } catch (error) {
      console.error("Invalid dates parameter:", error);
    }
  } else {
    // Set default date range if not present
    dateRange.from = undefined;
    dateRange.to = undefined;
  }

  const filters = {
    full_name: fullNameParam || undefined,
    category:
      categoryParam && categoryParam !== "all" ? categoryParam : undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters };
}
