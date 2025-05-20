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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  currentPage: number;
  currentLimit: number;
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
  currentPage,
  currentLimit,
  paginatedData,
}: DataTableProps<TData, TValue>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParam = useSearchParams();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  //-- Start search params
  const [clinicName, setClinicName] = React.useState(
    searchParam.get("clinic_name") || ""
  );
  const [treatmentId, setTreatmentId] = React.useState(
    searchParam.get("treatment_id") || ""
  );
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });

  const debouncedClinicName = useDebounce(clinicName || "", 500);
  //-- End search params

  const buildSearchParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams(searchParam.toString());

    params.set("clinic_name", debouncedClinicName);
    if (treatmentId) params.set("treatment_id", treatmentId);
    Object.entries(overrides).forEach(([key, value]) => {
      params.set(key, value);
    });

    return `${pathname}?${params.toString()}`;
  };

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
        pageSize: currentLimit,
      },
    },
  });

  React.useEffect(() => {
    router.push(
      buildSearchParams({
        page: "1",
        limit: String(currentLimit),
      })
    );
  }, [debouncedClinicName, treatmentId]);

  const changePageInSearchParams = (page: number) => {
    router.push(
      buildSearchParams({ page: String(page), limit: String(currentLimit) })
    );
  };

  const changeLimitInSearchParams = (limit: number) => {
    router.push(buildSearchParams({ page: "1", limit: String(limit) }));
  };
  return (
    <div>
      <div className="flex items-center gap-3 py-4">
        <Input
          placeholder="Search by clinic name..."
          value={clinicName}
          onChange={(event) => setClinicName(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={treatmentId}
          onValueChange={(value) => setTreatmentId(value)}
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
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="rounded-md border">
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
                  결과 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${currentLimit}`}
            onValueChange={(value) => changeLimitInSearchParams(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={currentLimit} />
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
            {/* Page {table.getState().pagination.pageIndex + 1} of{" "} */}
            {/* {table.getPageCount()} */}
            Page {currentPage} of {paginatedData.totalPages}
          </div>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => changePageInSearchParams(1)}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => changePageInSearchParams(currentPage - 1)}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => changePageInSearchParams(currentPage + 1)}
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => changePageInSearchParams(paginatedData.totalPages)}
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
