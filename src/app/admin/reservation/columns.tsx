"use client";

import { ColumnDef } from "@tanstack/react-table";

import { CellAction } from "./cell-actions";
import { format } from "date-fns";

export type ReservationTable = {
  id: string;
  reservation_date: string;
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

export const columns: ColumnDef<ReservationTable>[] = [
  {
    accessorKey: "category_name",
    header: "Category",
    cell: ({ row }) => (
      <div>{row.original.clinic_treatment.treatment.treatment_name}</div>
    ),
  },
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
    accessorKey: "residence",
    header: "Residence",
    cell: ({ row }) => <div>{row.original.patient.residence}</div>,
  },
  {
    accessorKey: "workplace",
    header: "Workplace",
    cell: ({ row }) => <div>{row.original.patient.work_place}</div>,
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
    cell: ({ row }) => <div>{row.original.patient.contact_number}</div>,
  },
  {
    accessorKey: "clinic_name",
    header: "Clinic Name",
    cell: ({ row }) => (
      <div>{row.original.clinic_treatment.clinic.clinic_name}</div>
    ),
  },

  {
    accessorKey: "reservation_date",
    header: "Reservation Date",
    cell: ({ row }) => (
      <div>
        {format(row.original.reservation_date, "yyyy-MM-dd hh:mm:ss a")}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
