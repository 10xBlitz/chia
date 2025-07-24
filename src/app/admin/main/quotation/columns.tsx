"use client";

import { ColumnDef } from "@tanstack/react-table";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CellAction } from "./cell-actions";
import { Tables } from "@/lib/supabase/types";
import { calculateAge } from "@/lib/utils";

// export type QuotationTable = {
//   id: string;
//   name: string;
//   gender: string;
//   birthdate: string;
//   region: string;
//   residence: string;
//   concern: string | null;
//   treatment_id: string | null;
//   clinic_id: string | null;
//   created_at: string;
//   status: string;
//   bid: Tables<"bid">[] | null;
//   treatment?: {
//     treatment_name: string;
//   } | null;
//   clinic?: {
//     clinic_name: string;
//   } | null;
// };

export type QuotationTable = Tables<"quotation"> & {
  treatment: {
    id: string;
    treatment_name: string;
    image_url: string | null;
    status: string;
  } | null;
  clinic: {
    clinic_name: string;
    status: string;
  } | null;
  bid: {
    id: string;
    expected_price_min: number;
    expected_price_max: number;
    additional_explanation: string | null;
    recommend_quick_visit: boolean;
    status: "active" | "deleted";
    created_at: string;
    clinic_treatment_id: string;
  }[];
};

export const columns: ColumnDef<QuotationTable>[] = [
  {
    accessorKey: "treatment_name",
    header: "진료 항목", // Treatment
    cell: ({ row }) => (
      <div>{row.original.treatment?.treatment_name || "일반 상담"}</div>
    ),
  },
  {
    accessorKey: "age",
    header: "나이", // Age
    cell: ({ row }) => {
      const birthdate = new Date(row.original.birthdate);
      return <div>{calculateAge(birthdate)}</div>;
    },
  },
  {
    accessorKey: "name",
    header: "이름", // Name
    cell: ({ row }) => <div>{row.original.name}</div>,
  },
  {
    accessorKey: "gender",
    header: "성별", // Gender
    cell: ({ row }) => <div>{row.original.gender}</div>,
  },
  {
    accessorKey: "region",
    header: "지역", // Region
    cell: ({ row }) => <div>{row.original.region}</div>,
  },
  {
    accessorKey: "residence",
    header: "거주지", // Residence
    cell: ({ row }) => <div>{row.original.residence}</div>,
  },
  {
    accessorKey: "concern",
    header: "상담 내용", // Concern
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">
        {row.original.concern || "-"}
      </div>
    ),
  },
  {
    accessorKey: "clinic_name",
    header: "병원명", // Clinic Name
    cell: ({ row }) => (
      <div>{row.original.clinic?.clinic_name || "전체 공개"}</div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "생성일", // Created Date
    cell: ({ row }) => (
      <div>
        {format(new Date(row.original.created_at), "yyyy년 M월 d일", {
          locale: ko,
        })}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />, // Actions
  },
];
