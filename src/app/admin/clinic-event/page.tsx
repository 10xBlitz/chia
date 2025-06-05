"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Loading from "@/components/loading";
import { ClinicEventModal } from "./clinic-event-modal";
import { useState } from "react";
import { validateClinicQueryParams } from "./cell-actions";
import { getPaginatedClinicEvents } from "@/lib/supabase/services/clinic-event.services";

export default function ClinicEventPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const { page, limit, filters } = validateClinicQueryParams(searchParams);

  const { isError, error, data, isLoading } = useQuery({
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

  return (
    <div className="py-10">
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
      {isLoading && <Loading />}
      {data && (
        <DataTable
          columns={columns}
          paginatedData={data}
          onClickAdd={() => setOpenModal(true)}
        />
      )}
    </div>
  );
}
