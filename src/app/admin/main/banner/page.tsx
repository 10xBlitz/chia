"use client";

import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { BannerModal } from "./banner-modal";
import { useState, Suspense } from "react";
import { getPaginatedBanners } from "@/lib/supabase/services/banner.services";
import { DataTable } from "./data-table";
import { columns } from "./columns";

function BannerPageContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const { page, limit, filters } = validateBannerQueryParams(searchParams);

  const { data, isFetching } = useQuery({
    queryKey: [
      "banners",
      page,
      limit,
      filters.banner_type,
      filters.title,
      filters.startDate,
      filters.endDate,
    ],
    queryFn: async () =>
      await getPaginatedBanners(page, limit, {
        ...filters,
        banner_type:
          filters.banner_type === "main"
            ? "main"
            : filters.banner_type === "sub"
            ? "sub"
            : undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const paginatedData = data || {
    data: [],
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  return (
    <div className="p-4">
      <BannerModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: ["banners"],
          })
        }
      />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          배너 관리 {/* Banner Management */}
        </h1>
      </div>

      <DataTable
        columns={columns}
        paginatedData={paginatedData}
        onClickAdd={() => setOpenModal(true)}
        isLoading={isFetching}
      />
    </div>
  );
}

function validateBannerQueryParams(searchParams: ReadonlyURLSearchParams) {
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const banner_type = searchParams.get("banner_type");
  const title = searchParams.get("title");
  // Parse date range from 'dates' param (JSON string)
  let startDate: string | undefined = undefined;
  let endDate: string | undefined = undefined;
  const datesParam = searchParams.get("dates");
  if (datesParam) {
    try {
      const decoded = JSON.parse(decodeURIComponent(datesParam));
      if (decoded.from) startDate = decoded.from;
      if (decoded.to) endDate = decoded.to;
    } catch {
      // ignore parse error
    }
  }
  return {
    page,
    limit,
    filters: {
      banner_type:
        banner_type === "main" || banner_type === "sub"
          ? banner_type
          : undefined,
      title: title || undefined,
      startDate,
      endDate,
    },
  };
}

export default function BannerPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-4">Loading...</div>}>
      <BannerPageContent />
    </Suspense>
  );
}
