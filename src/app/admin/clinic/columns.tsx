"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, EditIcon, EyeIcon, Trash2Icon } from "lucide-react";
import { Tables } from "@/lib/supabase/types";
import { calculateAge } from "@/lib/utils";

import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  // {
  //   accessorKey: "category",
  //   header: "Category",
  //   cell: ({ row }) => <div>{row.original.treatment}</div>,
  // },
  // {
  //   accessorKey: "location",
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Location
  //         <ArrowUpDown className="ml-2 h-4 w-4" />
  //       </Button>
  //     );
  //   },
  //   cell: ({ row }) => <>{calculateAge(new Date(row.original.birthdate))}</>,
  // },
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
