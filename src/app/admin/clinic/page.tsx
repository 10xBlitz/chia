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
import { getPaginatedClinics } from "@/lib/supabase/services/clinics.services";
import { ClinicModal } from "./clinic-modal";
import { useState } from "react";
import { validateClinicQueryParams } from "./cell-actions";

export default function ClinicPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
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
    <div className="py-10">
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
              filters.category,
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
