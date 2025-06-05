"use client";

import { ColumnDef } from "@tanstack/react-table";

import { CellAction } from "./cell-actions";
import { getPaginatedClinicEvents } from "@/lib/supabase/services/clinic-event.services";
import Image from "next/image";
import { parseDateFromSupabase } from "@/lib/utils";

export type ClinicEventTable = Awaited<
  ReturnType<typeof getPaginatedClinicEvents>
>["data"][number];

export const columns: ColumnDef<ClinicEventTable>[] = [
  {
    accessorKey: "clinic_name",
    header: "Clinic Name",
    cell: ({ row }) => (
      <>{row.original.clinic_treatment?.clinic?.clinic_name}</>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => <>{row.original.discount.toFixed(2)}</>,
  },
  {
    accessorKey: "date_rage",
    header: "Date Range",
    cell: ({ row }) => {
      const dates = parseDateFromSupabase(row.original.date_range as string);

      return (
        <>
          {dates?.from && dates?.to ? (
            <span>
              {dates.from.toLocaleDateString()} -{" "}
              {dates.to.toLocaleDateString()}
            </span>
          ) : (
            <>No Date Range</>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <>
        {row.original.image_url ? (
          <Image
            src={row.original.image_url}
            height={100}
            width={100}
            alt={row.original.title}
          />
        ) : (
          <>No Image</>
        )}
      </>
    ),
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
