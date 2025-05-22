"use client";

import { ColumnDef } from "@tanstack/react-table";

import { CellAction } from "./cell-actions";

export type ClinicTable = {
  id: number;
  clinic_name: string;
  location: string;
  contact_number: string;
  link: string | null;
  pictures: string | null;
  region: string;
  views: number;
  clinic_treatment: {
    id: number;
    treatment: {
      id: number;
      treatment_name: string;
      image_url: string | null;
    };
  }[];
};

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
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
