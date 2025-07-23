"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Loading from "@/components/loading";
import { getPaginatedQuotations } from "@/lib/supabase/services/quotation.services";

export default function QuotationPage() {
  const searchParams = useSearchParams();
  const { page, limit, filters, sort } =
    validateQuotationQueryParams(searchParams);

  const { isError, error, data, isLoading } = useQuery({
    queryKey: [
      "quotations",
      page,
      limit,
      filters.name,
      filters.status,
      filters.region,
      filters.date_range,
      sort,
    ],
    queryFn: async () =>
      await getPaginatedQuotations(page, limit, filters, sort),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  console.log("---->data: ", data);

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

function validateQuotationQueryParams(searchParams: ReadonlyURLSearchParams) {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const nameParam = searchParams.get("name");
  const statusParam = searchParams.get("status");
  const regionParam = searchParams.get("region");
  const encodedDates = searchParams.get("dates");
  const sortParam = searchParams.get("sort") || "created_at:desc";

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
    name: nameParam || undefined,
    status: (statusParam && statusParam !== "all" ? statusParam : undefined) as
      | "active"
      | "deleted"
      | undefined,
    region: regionParam || undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters, sort: sortParam };
}
