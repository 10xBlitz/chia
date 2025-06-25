"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-actions";
import Image from "next/image";
import { Tables } from "@/lib/supabase/types";

export type BannerTable = Tables<"banner">;

export const columns: ColumnDef<BannerTable>[] = [
  {
    accessorKey: "banner_type",
    header: "배너 타입", // Banner Type
    cell: ({ row }) =>
      row.original.banner_type === "main"
        ? "메인" // Main
        : row.original.banner_type === "sub"
        ? "서브" // Sub
        : "알 수 없음", // Unknown
  },
  {
    accessorKey: "title",
    header: "제목", // Title
  },
  {
    accessorKey: "image",
    header: "이미지", // Image
    cell: ({ row }) => {
      return row.original.image ? (
        <Image
          src={row.original.image.trimEnd()}
          height={60}
          width={120}
          alt={row.original.title || "배너 이미지"} // Banner image
          className="object-cover rounded"
        />
      ) : (
        <>이미지 없음</> // No Image
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "생성일", // Created At
    cell: ({ row }) => (
      <>{new Date(row.original.created_at).toLocaleDateString("ko-KR")}</>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />, // Actions
  },
];
