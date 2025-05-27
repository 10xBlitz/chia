"use client";

import { ColumnDef } from "@tanstack/react-table";

import { CellAction } from "./cell-actions";

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
    header: "Age",
    cell: ({ row }) => {
      const birthdate = new Date(row.original.patient.birthdate);
      const age = new Date().getFullYear() - birthdate.getFullYear();
      return <div>{age}</div>;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.original.patient.full_name}</div>,
  },
  {
    accessorKey: "clinic_name",
    header: "Clinic Name",
    cell: ({ row }) => (
      <div>{row.original.clinic_treatment.clinic.clinic_name}</div>
    ),
  },
  {
    accessorKey: "rating",
    header: "Rating",
  },
  {
    accessorKey: "review",
    header: "Review",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
