import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { CellAction } from "./cell-actions";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import { Badge } from "@/components/ui/badge";

export type TreatmentTable = Awaited<
  ReturnType<typeof getPaginatedTreatments>
>["data"][number];

export const columns: ColumnDef<TreatmentTable>[] = [
  {
    accessorKey: "treatment_name",
    header: "Treatment Name",
  },
  {
    accessorKey: "image_url",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;

      return imageUrl ? (
        <Image
          src={imageUrl}
          alt={row.original.treatment_name}
          width={50}
          height={50}
          className="object-cover rounded"
        />
      ) : (
        <span className="text-gray-500">No Image</span>
      );
    },
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <>
        <Badge
          variant={row.original.status === "active" ? "default" : "destructive"}
        >
          {row.original.status}
        </Badge>
      </>
    ),
  },

  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ getValue }) =>
      getValue() ? new Date(getValue() as string).toLocaleDateString() : "-",
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
