"use client";

import {
  ColumnDef,
  SortingState,
  getSortedRowModel,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PlusSquareIcon,
} from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  paginatedData: {
    data: TData[];
    totalItems: number | null;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onClickAdd: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  paginatedData,
  onClickAdd,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParam = useSearchParams();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // Use search params for pagination and filters (no local state)
  const pageParam = searchParam.get("page")
    ? Number(searchParam.get("page"))
    : 1;
  const limitParam = searchParam.get("limit")
    ? Number(searchParam.get("limit"))
    : 10;
  const bannerTitleParam = searchParam.get("title") || "";
  const bannerType = searchParam.get("banner_type") || "";
  const datesParam = searchParam.get("dates");
  let dates: { from: Date; to: Date } | undefined;
  if (datesParam) {
    const decodedDates = JSON.parse(decodeURIComponent(datesParam));
    if (decodedDates.from && decodedDates.to) {
      dates = {
        from: new Date(decodedDates.from),
        to: new Date(decodedDates.to),
      };
    } else {
      dates = undefined;
    }
  } else {
    dates = undefined;
  }

  const [bannerTitleInput, setBannerTitleInput] =
    React.useState(bannerTitleParam);
  const debouncedBannerTitle = useDebounce(bannerTitleInput, 300);

  // Keep input in sync with param (e.g. on back/forward navigation)
  React.useEffect(() => {
    setBannerTitleInput(bannerTitleParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerTitleParam]);

  // Debounce bannerTitle and update param, resetting page
  React.useEffect(() => {
    if (debouncedBannerTitle !== bannerTitleParam) {
      updateParam("title", debouncedBannerTitle, { resetPage: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBannerTitle]);

  const table = useReactTable({
    data: paginatedData.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: 0,
        pageSize: limitParam,
      },
    },
  });

  // Only reset page to 1 if a filter or limit changes
  const updateParam = React.useCallback(
    (key: string, value: string, options?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParam.toString());
      params.set(key, value);
      if (options?.resetPage) {
        params.set("page", "1");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParam, router]
  );

  const textSize = "text-[12px] sm:text-sm";
  const filterTextSize = "text-[10px] sm:text-xs";

  return (
    <div className="max-w-[90dvw] mx-auto">
      <div className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="제목으로 검색..." // Search by title...
            value={bannerTitleInput}
            onChange={(event) => setBannerTitleInput(event.target.value)}
            className={cn("max-w-sm h-[45px] bg-white", filterTextSize)}
          />
          <Select
            value={bannerType}
            onValueChange={(value) =>
              updateParam("banner_type", value, { resetPage: true })
            }
          >
            <SelectTrigger
              className={cn("min-h-[45px] w-[120px] bg-white", filterTextSize)}
            >
              <SelectValue placeholder="배너 타입" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="main">메인</SelectItem>
              <SelectItem value="sub">서브</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal h-[40] sm:h-[45px]",
                  !dates && "text-muted-foreground",
                  filterTextSize
                )}
              >
                <CalendarIcon />
                {dates?.from ? (
                  dates.to ? (
                    <>
                      {format(dates.from, "yyyy년 M월 d일", { locale: ko })} -{" "}
                      {format(dates.to, "yyyy년 M월 d일", { locale: ko })}
                    </>
                  ) : (
                    format(dates.from, "yyyy년 M월 d일", { locale: ko })
                  )
                ) : (
                  <span>날짜 선택</span> // Pick a date
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dates?.from}
                selected={dates}
                locale={ko}
                onSelect={(dates) => {
                  if (dates?.from && dates?.to) {
                    updateParam(
                      "dates",
                      JSON.stringify({
                        from: dates.from.toISOString(),
                        to: dates.to.toISOString(),
                      }),
                      { resetPage: true }
                    );
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          onClick={onClickAdd}
          className={cn(
            "bg-white text-black h-[40] sm:h-[45px] border-1 hover:bg-black/20",
            filterTextSize
          )}
        >
          <PlusSquareIcon className="size-3 sm:size-4" />{" "}
          <span className="hidden sm:inline">
            배너 추가 {/** Add banner */}{" "}
          </span>
        </Button>
      </div>
      <div className="rounded-md border bg-white">
        <Table className={cn("w-full", textSize)}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  결과 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className={cn("font-medium", textSize)}>
            페이지당 행 수 {/**Rows per page */}
          </p>
          <Select
            value={`${limitParam}`}
            onValueChange={(value) =>
              updateParam("limit", value, { resetPage: true })
            }
          >
            <SelectTrigger className={cn("h-8 w-[70px] bg-white", textSize)}>
              <SelectValue placeholder={limitParam} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "flex items-center justify-center font-medium",
              textSize
            )}
          >
            {/* Page {table.getState().pagination.pageIndex + 1} of{" "} */}
            {/* {table.getPageCount()} */}
            {/**page */} {pageParam} / {paginatedData.totalPages} 페이지
          </div>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => updateParam("page", "1")}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (pageParam - 1).toString())}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (pageParam + 1).toString())}
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() =>
              updateParam("page", paginatedData.totalPages.toString())
            }
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
