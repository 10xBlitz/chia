"use client";

import { ColumnDef } from "@tanstack/react-table";

// import { CellAction } from "./cell-actions";

export type ReviewTable = {
  id: string;
  rating: number;
  review: string | null;
  patient: {
    id: string;
    full_name: string;
    residence: string;
    birthdate: string;
    work_place: string;
    contact_number: string;
  };
  clinic_treatment: {
    id: string;
    treatment: {
      treatment_name: string;
    };
    clinic: {
      clinic_name: string;
    };
  };
};

export const columns: ColumnDef<ReviewTable>[] = [
  {
    accessorKey: "age",
    header: "나이", // Age
    cell: ({ row }) => {
      const birthdate = new Date(row.original.patient.birthdate);
      const age = new Date().getFullYear() - birthdate.getFullYear();
      return <div>{age}</div>;
    },
  },
  {
    accessorKey: "name",
    header: "이름", // Name
    cell: ({ row }) => <div>{row.original.patient.full_name}</div>,
  },
  {
    accessorKey: "clinic_name",
    header: "병원", // Hospital
    cell: ({ row }) => (
      <div>{row.original.clinic_treatment.clinic.clinic_name}</div>
    ),
  },
  {
    accessorKey: "rating",
    header: "평점", // Rating
  },
  {
    accessorKey: "review",
    header: "리뷰", // Review
    cell: ({ row }) => (
      <div className="max-w-xs whitespace-pre-wrap break-words">
        {row.original.review || "리뷰 없음"}
      </div>
    ),
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => <CellAction data={row.original} />, // 액션 // Action
  // },
];
