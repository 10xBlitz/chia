"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { calculateAge } from "@/lib/utils";

import { CellAction } from "./cell-actions";

export type UserColumn = {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  login_status: string;
  gender: string;
  birthdate: string;
  residence: string;
  work_place: string;
  contact_number: string;
  clinic_id: string;
  email: string;
};

export const columns: ColumnDef<
  UserColumn,
  unknown & { meta?: { className?: string } }
>[] = [
  {
    accessorKey: "category",
    header: "범주", // Category
    cell: ({ row }) => (
      <div>{`${row.original.role[0].toUpperCase()}${row.original.role.substring(
        1
      )}`}</div>
    ),
    meta: { className: "hidden sm:table-cell max-w-[100px]" }, // Hide on mobile
  },

  {
    accessorKey: "birthdate", // Use birthdate for sorting
    header: ({ column }) => {
      return (
        <div className="relative mr-3 flex items-center justify-center w-full">
          <Button
            variant="ghost"
            className="flex min-w-[20px] items-center justify-center px-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="text-xs sm:text-md font-semibold text-center">
              나이
            </span>{" "}
            {/* age */}
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <>
        {new Date(row.original.birthdate).toLocaleDateString("ko-KR")} (
        {calculateAge(new Date(row.original.birthdate))})
      </>
    ),
    enableSorting: true,
    meta: { className: " text-center" },
  },
  {
    accessorKey: "sort",
    header: () => (
      <>
        <ArrowUpDown className="size-3" />
      </>
    ),
    meta: { className: "-translate-x-4" }, // Hide on mobile
  },

  {
    accessorKey: "email",
    header: "이메일", // Email
    meta: { className: "hidden sm:table-cell " }, // Hide on mobile
  },

  {
    accessorKey: "full_name",
    header: "성명", // Full Name
    meta: { className: "hidden sm:table-cell -ml-10" }, // Hide on mobile
  },
  {
    accessorKey: "residence",
    header: "거주", //residence
    meta: { className: "" },
  },
  {
    accessorKey: "work_place",
    header: "직장", //workplace
  },
  {
    accessorKey: "contact_number",
    header: "연락처", // Contact Number
    meta: { className: "hidden sm:table-cell" }, // Hide on mobile
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />, // 액션 // Action
  },
];
