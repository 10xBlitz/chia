"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditIcon, MoreHorizontal, Trash2Icon } from "lucide-react";
import { ReservationTable } from "./columns";

interface CellActionProps {
  data: ReservationTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  console.log(data);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">메뉴 열기</span> {/* Open menu */}
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <EditIcon className="h-4 w-4" /> 수정 {/* Update */}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Trash2Icon className="h-4 w-4" /> 삭제 {/* Delete */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
