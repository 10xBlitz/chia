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
    accessorKey: "thumbnail",
    header: () => <div className="text-center">썸네일</div>, // Thumbnail
    cell: ({ row }) => (
      <div className="flex justify-center items-center p-2">
        {row.original.thumbnail_url ? (
          <div className="relative w-[80px] h-[80px] rounded overflow-hidden flex-shrink-0">
            <Image
              src={row.original.thumbnail_url}
              alt={`${row.original.title} 썸네일`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[80px] h-[80px] flex items-center justify-center text-xs text-gray-500 bg-gray-100 rounded flex-shrink-0">
            썸네일 없음
          </div>
        )}
      </div>
    ),
    size: 100,
    minSize: 100,
    maxSize: 100,
  },
  {
    accessorKey: "image",
    header: () => <div className="text-center">메인 이미지</div>, // Main Image
    cell: ({ row }) => (
      <div className="flex justify-center items-center p-2">
        {row.original.image_url ? (
          <div className="relative w-[80px] h-[80px] rounded overflow-hidden flex-shrink-0">
            <Image
              src={row.original.image_url}
              alt={row.original.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[80px] h-[80px] flex items-center justify-center text-xs text-gray-500 bg-gray-100 rounded flex-shrink-0">
            메인 이미지 없음
          </div>
        )}
      </div>
    ),
    size: 100,
    minSize: 100,
    maxSize: 100,
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
