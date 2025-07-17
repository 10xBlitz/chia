"use client";

import { getPaginatedUsersWithEmail } from "@/lib/supabase/services/users.services";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Tables } from "@/lib/supabase/types";
import { SortingState } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";

export default function UserPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { page, limit, filters, sort, order } =
    validateUserQueryParams(searchParams);

  // Memoize sorting to avoid useCallback dependency warning
  const sorting = useMemo<SortingState>(
    () => (sort ? [{ id: sort, desc: order === "desc" }] : []),
    [sort, order]
  );

  // Handle sorting change: update URL params
  // If sorting by 'age', actually sort by 'birthdate'
  const onSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      let nextSort = next[0]?.id || undefined;
      const nextOrder = next[0]?.desc ? "desc" : "asc";
      // If sorting by 'age', actually sort by 'birthdate'
      if (nextSort === "age") {
        nextSort = "birthdate";
      }
      const params = new URLSearchParams(searchParams.toString());
      const currentSort = searchParams.get("sort") || undefined;
      const currentOrder = searchParams.get("order") || "desc";
      // Only reset page if sort or order actually changes
      if (nextSort !== currentSort || nextOrder !== currentOrder) {
        params.set("page", "1");
      }
      if (nextSort) {
        params.set("sort", nextSort);
        params.set("order", nextOrder);
      } else {
        params.delete("sort");
        params.delete("order");
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, sorting]
  );

  const { isError, error, data, isFetching } = useQuery({
    queryKey: [
      "users",
      page,
      limit,
      filters.full_name,
      filters.category,
      filters.date_range,
      sort,
      order,
    ],
    queryFn: async () =>
      await getPaginatedUsersWithEmail(page, limit, filters, sort, order),
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
    <div className="py-4 px-4">
      {isError && <div className="bg-red-500/20">{error.message}</div>}
      <DataTable
        columns={columns}
        paginatedData={paginatedData}
        sorting={sorting}
        onSortingChange={onSortingChange}
        isLoading={isFetching}
      />
    </div>
  );
}

function validateUserQueryParams(searchParams: ReadonlyURLSearchParams) {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const fullNameParam = searchParams.get("full_name");
  const categoryParam = searchParams.get("category");
  const encodedDates = searchParams.get("dates");
  const sort = searchParams.get("sort") || undefined;
  const order = searchParams.get("order") || "desc";

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
    dateRange.from = undefined;
    dateRange.to = undefined;
  }

  const filters = {
    full_name: fullNameParam || undefined,
    category:
      categoryParam && categoryParam !== "all"
        ? (categoryParam as Tables<"user">["role"])
        : undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters, sort, order };
}
