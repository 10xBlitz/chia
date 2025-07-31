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
    header: "병원 이름", // Clinic Name
  },
  {
    accessorKey: "full_address",
    header: "전체 주소", // Full Address
  },
  {
    accessorKey: "city",
    header: "도시", // City
  },
  {
    accessorKey: "region",
    header: "지역", // Region
  },
  {
    accessorKey: "contact_number",
    header: "연락처", // Contact
  },
  {
    accessorKey: "views",
    header: "조회수", // Views
    cell: ({ row }) => <>{row.original.clinic_view?.length}</>,
  },
  {
    accessorKey: "is_pinned",
    header: "고정 여부", // Is Pinned
    cell: ({ row }) => <>{row.original.is_pinned ? "Yes" : "No"}</>,
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
