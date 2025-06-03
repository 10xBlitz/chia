"use client";

import { getPaginatedUsers } from "@/lib/supabase/services/users.services";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Loading from "@/components/loading";
import { Tables } from "@/lib/supabase/types";

export default function UserPage() {
  const searchParams = useSearchParams();
  const { page, limit, filters } = validateUserQueryParams(searchParams);

  const { isError, error, data, isLoading } = useQuery({
    queryKey: [
      "users",
      page,
      limit,
      filters.full_name,
      filters.category,
      filters.date_range,
    ],
    queryFn: async () => await getPaginatedUsers(page, limit, filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="py-10">
      {isError && <div className="bg-red-500/20">{error.message}</div>}
      {isLoading && <Loading />}
      {data && <DataTable columns={columns} paginatedData={data} />}
    </div>
  );
}

function validateUserQueryParams(searchParams: ReadonlyURLSearchParams) {
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
  }

  const filters = {
    full_name: fullNameParam || undefined,
    category:
      categoryParam && categoryParam !== "all"
        ? (categoryParam as Tables<"user">["role"])
        : undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters };
}
