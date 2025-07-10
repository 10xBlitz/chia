"use client";

import {
  ColumnDef,
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
import { DateRange } from "react-day-picker";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  paginatedData: {
    data: TData[];
    totalItems: number | null;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const textSize = "text-[12px] sm:text-sm";
const filterTextSize = "text-[10px] sm:text-xs";

export function DataTable<TData, TValue>({
  columns,
  paginatedData,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParam = useSearchParams();
  // Read sorting from URL param
  //   const sortParam = searchParam.get("sort") || "created_at:desc";
  //   const [sorting, setSorting] = React.useState<SortingState>(() => {
  //     const [id, dir] = sortParam.split(":");
  //     return id ? [{ id, desc: dir === "desc" }] : [];
  //   });
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
  const name = searchParam.get("name") || "";
  const status = searchParam.get("status") || "all";
  const region = searchParam.get("region") || "";
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

  // Define state for filters and update URL accordingly
  const [nameFilter, setNameFilter] = React.useState(name);
  const [statusFilter, setStatusFilter] = React.useState(status);
  const [regionFilter, setRegionFilter] = React.useState(region);
  const [dateFilter, setDateFilter] = React.useState<DateRange | undefined>(
    dates
  );

  // Debounce the name input
  const debouncedName = useDebounce(nameFilter, 300);

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

  // Debounce nameFilter and update param, resetting page
  React.useEffect(() => {
    const current = searchParam.get("name") || "";
    if (debouncedName !== current) {
      updateParam("name", debouncedName, { resetPage: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName]);

  // Sync nameFilter with URL param on mount or when URL param changes (for back/forward navigation)
  React.useEffect(() => {
    setNameFilter(name);
  }, [name]);

  // Update URL when filters change (debounced for name)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedName) params.set("name", debouncedName);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (regionFilter) params.set("region", regionFilter);
    if (dateFilter?.from && dateFilter?.to) {
      params.set(
        "dates",
        encodeURIComponent(
          JSON.stringify({
            from: dateFilter.from.toISOString(),
            to: dateFilter.to.toISOString(),
          })
        )
      );
    }
    params.set("page", "1"); // Reset to first page when filters change
    params.set("limit", String(limitParam));

    router.push(`?${params.toString()}`);
  }, [
    debouncedName,
    statusFilter,
    regionFilter,
    dateFilter,
    limitParam,
    router,
  ]);

  // Sync filter state with URL params when they change
  React.useEffect(() => {
    setNameFilter(name);
  }, [name]);

  // Update URL when sorting changes
  //   React.useEffect(() => {
  //     const params = new URLSearchParams(searchParam.toString());
  //     if (sorting.length > 0) {
  //       params.set(
  //         "sort",
  //         `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
  //       );
  //     } else {
  //       params.delete("sort");
  //     }
  //     params.set("page", "1"); // Reset to first page on sort
  //     router.push(`?${params.toString()}`);
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [sorting]);

  const table = useReactTable({
    data: paginatedData.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Remove client-side sorting
    // onSortingChange: setSorting,
    // getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      // sorting,
      columnFilters,
      pagination: {
        pageIndex: 0,
        pageSize: limitParam,
      },
    },
  });

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParam.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  const updateLimit = (newLimit: number) => {
    const params = new URLSearchParams(searchParam.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1"); // Reset to first page when limit changes
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 py-4">
        <Input
          placeholder="이름으로 검색..." // Search by name
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          className={cn("max-w-sm h-[45px] bg-white", filterTextSize)}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className={cn("w-[180px] min-h-[45px] bg-white ", filterTextSize)}
          >
            <SelectValue placeholder="상태 선택" /> {/* Select status */}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem> {/* All */}
            <SelectItem value="active">활성</SelectItem> {/* Active */}
            <SelectItem value="deleted">삭제됨</SelectItem> {/* Deleted */}
          </SelectContent>
        </Select>

        <Input
          placeholder="지역으로 검색..." // Search by region
          value={regionFilter}
          onChange={(event) => setRegionFilter(event.target.value)}
          className={cn("max-w-sm h-[45px] bg-white", filterTextSize)}
        />

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground",
                  filterTextSize
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter?.from ? (
                  dateFilter.to ? (
                    <>
                      {format(dateFilter.from, "LLL dd, y", { locale: ko })} -{" "}
                      {format(dateFilter.to, "LLL dd, y", { locale: ko })}
                    </>
                  ) : (
                    format(dateFilter.from, "LLL dd, y", { locale: ko })
                  )
                ) : (
                  <span>날짜 범위 선택</span> // Select date range
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateFilter?.from}
                selected={dateFilter}
                onSelect={setDateFilter}
                numberOfMonths={2}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button
              variant="outline"
              onClick={() => setDateFilter(undefined)}
              className={filterTextSize}
            >
              초기화 {/* Reset */}
            </Button>
          )}
        </div>
      </div>

      {/* Sort by date created */}
      {/* <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          className={cn("h-8 px-3 py-1 text-xs", sorting.find(s => s.id === "created_at") ? "bg-blue-100 text-blue-800" : "")}
          onClick={() => {
            setSorting((prev) => {
              const current = prev.find((s) => s.id === "created_at");
              if (!current) return [{ id: "created_at", desc: true }];
              if (current.desc) return [{ id: "created_at", desc: false }];
              return [];
            });
          }}
        >
          생성일로 정렬 
          {sorting.find(s => s.id === "created_at") ? (
            sorting.find(s => s.id === "created_at")!.desc ? " ↓" : " ↑"
          ) : null}
        </Button>
      </div> */}

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table className={cn("w-full", textSize)}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={textSize}>
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
                    <TableCell key={cell.id} className={textSize}>
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
                  결과가 없습니다. {/* No results */}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className={cn("text-muted-foreground", filterTextSize)}>
            총 {paginatedData.totalItems}개 중{" "}
            {(pageParam - 1) * limitParam + 1}-
            {Math.min(pageParam * limitParam, paginatedData.totalItems || 0)}개
            표시 {/* Showing X-Y of Z total */}
          </p>
          <Select
            value={String(limitParam)}
            onValueChange={(value) => updateLimit(Number(value))}
          >
            <SelectTrigger
              className={cn("h-8 w-[70px] bg-white", filterTextSize)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className={cn("h-8 w-8 p-0 bg-white", filterTextSize)}
            onClick={() => updatePage(1)}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">첫 페이지로</span>{" "}
            {/* Go to first page */}
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={cn("h-8 w-8 p-0 bg-white", filterTextSize)}
            onClick={() => updatePage(pageParam - 1)}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">이전 페이지</span> {/* Previous page */}
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            className={cn(
              "flex w-[100px] items-center justify-center",
              filterTextSize
            )}
          >
            페이지 {pageParam} / {paginatedData.totalPages} {/* Page X of Y */}
          </div>
          <Button
            variant="outline"
            className={cn("h-8 w-8 p-0 bg-white", filterTextSize)}
            onClick={() => updatePage(pageParam + 1)}
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">다음 페이지</span> {/* Next page */}
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className={cn("h-8 w-8 p-0", filterTextSize)}
            onClick={() => updatePage(paginatedData.totalPages)}
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">마지막 페이지로</span>{" "}
            {/* Go to last page */}
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
