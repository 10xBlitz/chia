"use client";

import { useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Loading from "@/components/loading";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import { useState } from "react";
import { TreatmentModal } from "./treatment-modal";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { validateTreatmentQueryParams } from "./cell-actions";

export default function TreatmentsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const { page, limit, filters } = validateTreatmentQueryParams(searchParams);

  const { isError, error, data, isLoading } = useQuery({
    queryKey: [
      "treatments",
      page,
      limit,
      filters.treatment_name,
      filters.date_range,
    ],
    queryFn: async () => await getPaginatedTreatments(page, limit, filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="py-10 ">
      <TreatmentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: [
              "treatments",
              page,
              limit,
              filters.treatment_name,
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
