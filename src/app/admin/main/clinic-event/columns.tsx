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
    header: "병원 이름", // Clinic Name
    cell: ({ row }) => (
      <>{row.original.clinic_treatment?.clinic?.clinic_name}</>
    ),
  },
  {
    accessorKey: "title",
    header: "제목", // Title
  },
  {
    accessorKey: "description",
    header: "설명", //description
  },
  {
    accessorKey: "discount",
    header: "할인", //discount
    cell: ({ row }) => <>{row.original.discount.toFixed(2)}</>,
  },
  {
    accessorKey: "date_rage",
    header: "기간", //Period
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
            <>기간 없음 {/** No date range */}</>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "image",
    header: "이미지", // Image
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
          <>이미지 없음 {/** No image */}</>
        )}
      </>
    ),
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
