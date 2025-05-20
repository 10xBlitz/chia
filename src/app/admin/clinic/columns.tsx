"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, EditIcon, Trash2Icon } from "lucide-react";
import { Tables } from "@/lib/supabase/types";
import { calculateAge } from "@/lib/utils";

import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ClinicTable = {
  id: number;
  price: number;
  created_at: string;
  clinic: {
    id: number;
    clinic_name: string;
    location: string;
    contact_number: string;
    link: string | null;
    pictures: string | null;
    region: string;
    views: number;
  };
  treatment: {
    id: number;
    treatment_name: string;
    image_url: string | null;
  };
};

export const columns: ColumnDef<ClinicTable>[] = [
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <div>{row.original?.treatment?.treatment_name}</div>,
  },
  {
    accessorKey: "clinic_name",
    header: "Clinic Name",
    cell: ({ row }) => <div>{row.original?.clinic?.clinic_name}</div>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <div>{row.original?.clinic?.location}</div>,
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => <div>{row.original?.clinic?.contact_number}</div>,
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => <div>{row.original?.clinic?.views}</div>,
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <EditIcon className="h-4 w-4" /> Update
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trash2Icon className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
