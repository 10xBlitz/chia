"use client";

import { getPaginatedUsers } from "@/lib/supabase/services/users.services";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Loading from "@/components/loading";
import { Tables } from "@/lib/supabase/types";
import { addDays } from "date-fns";
import * as React from "react";
import { SortingState } from "@tanstack/react-table";

export default function UserPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { page, limit, filters, sort, order } =
    validateUserQueryParams(searchParams);

  // Memoize sorting to avoid useCallback dependency warning
  const sorting = React.useMemo<SortingState>(
    () => (sort ? [{ id: sort, desc: order === "desc" }] : []),
    [sort, order]
  );

  // Handle sorting change: update URL params
  const onSortingChange = React.useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      let nextSort = next[0]?.id || undefined;
      const nextOrder = next[0]?.desc ? "desc" : "asc";
      // If sorting by 'age', actually sort by 'birthdate'

      const params = new URLSearchParams(searchParams.toString());
      if (nextSort) {
        if (nextSort === "age") {
          nextSort = "birthdate";
        }
        params.set("sort", nextSort);
        params.set("order", nextOrder);
      } else {
        params.delete("sort");
        params.delete("order");
      }
      // Reset to first page on sort
      params.set("page", "1");
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, sorting]
  );

  const { isError, error, data, isLoading } = useQuery({
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
      await getPaginatedUsers(page, limit, filters, sort, order),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="py-10">
      {isError && <div className="bg-red-500/20">{error.message}</div>}
      {isLoading && <Loading />}
      {data && (
        <DataTable
          columns={columns}
          paginatedData={data}
          sorting={sorting}
          onSortingChange={onSortingChange}
        />
      )}
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
    dateRange.from = new Date().toISOString().split("T")[0];
    dateRange.to = addDays(new Date(), 5).toISOString().split("T")[0];
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
