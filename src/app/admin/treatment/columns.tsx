import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { CellAction } from "./cell-actions";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";

export type TreatmentTable = Awaited<
  ReturnType<typeof getPaginatedTreatments>
>["data"][number];

export const columns: ColumnDef<TreatmentTable>[] = [
  {
    accessorKey: "treatment_name",
    header: "진료명", // Treatment Name
  },
  {
    accessorKey: "image_url",
    header: "이미지", // Image
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
        <span className="text-gray-500">이미지 없음</span> // No Image
      );
    },
  },

  {
    accessorKey: "created_at",
    header: "생성일", // Created At
    cell: ({ getValue }) =>
      getValue() ? new Date(getValue() as string).toLocaleDateString() : "-",
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />, // Actions
  },
];
