"use client";

import { ColumnDef } from "@tanstack/react-table";

import { CellAction } from "./cell-actions";
import { getPaginatedClinics } from "@/lib/supabase/services/clinics.services";

export type ClinicTable = Awaited<
  ReturnType<typeof getPaginatedClinics>
>["data"][number];

export const columns: ColumnDef<ClinicTable>[] = [
  {
    accessorKey: "clinic_name",
    header: "Clinic Name",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => <>{row.original.clinic_view?.length}</>,
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
