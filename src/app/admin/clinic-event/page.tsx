"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ClinicEventModal } from "./clinic-event-modal";
import { useState } from "react";
import { getPaginatedClinicEvents } from "@/lib/supabase/services/clinic-event.services";

export default function ClinicEventPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const { page, limit, filters } = validateClinicEventQueryParams(searchParams);

  const { isError, error, data, isFetching } = useQuery({
    queryKey: [
      "clinic-events",
      page,
      limit,
      filters.clinic_name,
      filters.date_range,
    ],
    queryFn: async () => await getPaginatedClinicEvents(page, limit, filters),
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
      <ClinicEventModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: [
              "clinic-events",
              page,
              limit,
              filters.clinic_name,
              filters.date_range,
            ],
          })
        }
      />
      {isError && <div className="bg-red-500/20">{error.message}</div>}
      <DataTable
        columns={columns}
        paginatedData={paginatedData}
        onClickAdd={() => setOpenModal(true)}
        isLoading={isFetching}
      />
    </div>
  );
}

function validateClinicEventQueryParams(searchParams: ReadonlyURLSearchParams) {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const clinicNameParam = searchParams.get("clinic_name");
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
    dateRange.from = undefined;
    dateRange.to = undefined;
  }

  const filters = {
    clinic_name: clinicNameParam || undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters };
}
