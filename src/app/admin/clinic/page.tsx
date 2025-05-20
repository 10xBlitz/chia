import { getPaginatedUsers } from "@/lib/supabase/functions/get-paginated-users";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getPaginatedClinics } from "@/lib/supabase/functions/get-paginated-clinics";

export default async function ClinicPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | null };
}) {
  const { page, limit, filters } = validateUserQueryParams(searchParams);

  const data = await getPaginatedClinics(page, limit, filters);

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        paginatedData={data}
        currentPage={page}
        currentLimit={limit}
      />
    </div>
  );
}

export function validateUserQueryParams(
  searchParams: Record<string, string | null>
) {
  const pageParam = searchParams["page"];
  const limitParam = searchParams["limit"];
  const clinicParam = searchParams["clinic_name"];
  const treatmentIdParam = searchParams["treatment_id"];
  const createdAtParam = searchParams["created_at"];

  const page = pageParam ? Number(pageParam) : 1;
  const limit =
    limitParam && Number(limitParam) < 1000 ? Number(limitParam) : 10;

  const filters = {
    clinic_name: clinicParam || undefined,
    treatment_id:
      treatmentIdParam &&
      parseInt(treatmentIdParam) &&
      treatmentIdParam !== "all"
        ? parseInt(treatmentIdParam)
        : undefined,
    created_at: createdAtParam || undefined,
  };

  return { page, limit, filters };
}
