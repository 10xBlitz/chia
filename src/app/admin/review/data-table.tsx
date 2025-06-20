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
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  // currentPage: number;
  // currentLimit: number;
  paginatedData: {
    data: TData[];
    totalItems: number | null;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function DataTable<TData, TValue>({
  columns,

  paginatedData,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParam = useSearchParams();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  //-- Start search params states
  const pageParam = searchParam.get("page")
    ? Number(searchParam.get("page"))
    : 1;
  const limitParam = searchParam.get("limit")
    ? Number(searchParam.get("limit"))
    : 10;
  const [page, setPage] = React.useState(pageParam);
  const [limit, setLimit] = React.useState(limitParam);

  const [fullName, setFullName] = React.useState(
    searchParam.get("full_name") || ""
  );
  // const [category, setCategory] = React.useState(
  //   searchParam.get("category") || ""
  // );
  const [dates, setDates] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 5),
  });

  const debouncedFullName = useDebounce(fullName || "", 500);
  //-- End search params states

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
        pageSize: limit,
      },
    },
  });

  //debounced the fullName so that it doesn't trigger the search params update on every keystroke
  const updateParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParam.toString());

      //update or delete the param
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      //reset pagination when filter or limit changes
      if (key !== "page") {
        params.set("page", "1");
        setPage(1);
        setLimit(10);
      }

      //update local state
      if (key === "page") setPage(Number(value));

      if (key === "limit") setLimit(Number(value));

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParam]
  );

  React.useEffect(() => {
    updateParam("full_name", debouncedFullName);
  }, [debouncedFullName, updateParam]);
  return (
    <div>
      <div className="flex items-center gap-3 py-4">
        <Input
          // 이름으로 검색 (Search by full name)
          placeholder="이름으로 검색"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-[300px] bg-white h-[45px]"
        />
        {/* <Select
          value={category}
          defaultValue={category}
          onValueChange={(value) => {
            setCategory(value);
            updateParam("category", value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="dentist">Dentist</SelectItem>
              <SelectItem value="dentist_employee">Dentist Employee</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select> */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dates && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              {dates?.from ? (
                dates.to ? (
                  <>
                    {format(dates.from, "LLL dd, y")} -{" "}
                    {format(dates.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dates.from, "LLL dd, y")
                )
              ) : (
                // 날짜 선택 (Pick a date)
                <span>날짜 선택</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dates?.from}
              selected={dates}
              onSelect={(dates) => {
                setDates(dates);
                updateParam("dates", JSON.stringify(dates));
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
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
                  {/* 결과 없음 (No results) */}
                  결과 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          {/* 페이지당 행 수 (Rows per page) */}
          <p className="text-sm font-medium">페이지당 행 수</p>
          <Select
            value={`${limit}`}
            onValueChange={(value) => updateParam("limit", value)}
          >
            <SelectTrigger className="h-8 w-[70px] bg-white">
              <SelectValue placeholder={limit} />
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
          <div className="flex items-center justify-center text-sm font-medium">
            {/* 페이지 {page} / {paginatedData.totalPages} (Page {page} of {paginatedData.totalPages}) */}
            페이지 {page} / {paginatedData.totalPages}
          </div>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => updateParam("page", "1")}
            disabled={!paginatedData.hasPrevPage}
          >
            {/* 첫 페이지로 이동 (Go to first page) */}
            <span className="sr-only">첫 페이지로 이동</span>
            <ChevronsLeft />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (page - 1).toString())}
            disabled={!paginatedData.hasPrevPage}
          >
            {/* 이전 페이지로 이동 (Go to previous page) */}
            <span className="sr-only">이전 페이지로 이동</span>
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (page + 1).toString())}
            disabled={!paginatedData.hasNextPage}
          >
            {/* 다음 페이지로 이동 (Go to next page) */}
            <span className="sr-only">다음 페이지로 이동</span>
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
            {/* 마지막 페이지로 이동 (Go to last page) */}
            <span className="sr-only">마지막 페이지로 이동</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
