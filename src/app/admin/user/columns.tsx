"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Tables } from "@/lib/supabase/types";
import { calculateAge } from "@/lib/utils";

import { CellAction } from "./cell-actions";

export type UserTable = Tables<"user">;

export const columns: ColumnDef<UserTable>[] = [
  {
    accessorKey: "category",
    header: "범주", // Category
    cell: ({ row }) => (
      <div>{`${row.original.role[0].toUpperCase()}${row.original.role.substring(
        1
      )}`}</div>
    ),
  },
  {
    accessorKey: "age",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          나이 {/**age */}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <>{calculateAge(new Date(row.original.birthdate))}</>,
  },
  {
    accessorKey: "full_name",
    header: "성명", // Full Name
  },
  {
    accessorKey: "residence",
    header: "거주", //residence
  },
  {
    accessorKey: "work_place",
    header: "직장", //workplace
  },

  {
    accessorKey: "contact_number",
    header: "연락처", // Contact Number
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
