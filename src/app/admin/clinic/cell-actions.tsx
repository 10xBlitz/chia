"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Edit,
  EditIcon,
  EyeIcon,
  MoreHorizontal,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { ClinicTable } from "./columns";
import { TreatmentModal } from "./treatment-modal";

interface CellActionProps {
  data: ClinicTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ClinicTable | undefined>(undefined);

  return (
    <>
      {selected !== undefined && (
        <TreatmentModal
          data={selected}
          open={open}
          onClose={() => {
            setOpen(false);
            setSelected(undefined);
          }}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setOpen(true);
              setSelected(data);
            }}
          >
            <EyeIcon className="h-4 w-4" /> View Treatments
          </DropdownMenuItem>
          <DropdownMenuItem>
            <EditIcon className="h-4 w-4" /> Update
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Trash2Icon className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
