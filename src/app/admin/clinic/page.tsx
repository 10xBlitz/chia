"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Loading from "@/components/loading";
import { getPaginatedClinics } from "@/lib/supabase/services/clinics.services";
import { ClinicModal } from "./clinic-modal";
import { useState } from "react";
import { addDays } from "date-fns";

export default function ClinicPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const { page, limit, filters } = validateClinicQueryParams(searchParams);

  const { isError, error, data, isLoading } = useQuery({
    queryKey: ["clinics", page, limit, filters.clinic_name, filters.date_range],
    queryFn: async () => await getPaginatedClinics(page, limit, filters),
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
    <div className="py-4">
      <ClinicModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: [
              "clinics",
              page,
              limit,
              filters.clinic_name,
              filters.date_range,
            ],
          })
        }
      />
      {isError && <div className="bg-red-500/20">{error.message}</div>}
      {isLoading && <Loading />}
      <DataTable
        columns={columns}
        paginatedData={paginatedData}
        onClickAdd={() => setOpenModal(true)}
      />
    </div>
  );
}

function validateClinicQueryParams(searchParams: ReadonlyURLSearchParams) {
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
    dateRange.from = new Date().toISOString().split("T")[0];
    dateRange.to = addDays(new Date(), 5).toISOString().split("T")[0];
  }

  const filters = {
    clinic_name: clinicNameParam || undefined,
    date_range: Object.keys(dateRange).length > 0 ? dateRange : undefined,
  };

  return { page, limit, filters };
}
