"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteRestaurant, listRestaurants, RestaurantWithStats } from "@/actions/restaurant"
import { toast } from "sonner"
import { Dictionary } from "@/actions/dictionaries"

type RestaurantListProps = {
  t: Dictionary["dashboard"]["restaurants"]["list"]
}

export function RestaurantsList({ t }: RestaurantListProps) {
  const [data, setData] = React.useState<RestaurantWithStats[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = React.useState<string | null>(null)
  const [restaurantNameToDelete, setRestaurantNameToDelete] = React.useState<string | null>(null)
  const [deletingRestaurant, setDeletingRestaurant] = React.useState(false)

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const result = await listRestaurants()
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.message || t?.errors?.loadFailed || "Failed to load restaurants")
          toast.error(result.message || t?.errors?.loadFailed || "Failed to load restaurants")
        }
      } catch (err) {
        console.error(err)
        setError(t?.errors?.unexpected || "An unexpected error occurred")
        toast.error(t?.errors?.unexpected || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [t])

  const handleDelete = (id: string, name: string) => {
    setRestaurantToDelete(id)
    setRestaurantNameToDelete(name)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!restaurantToDelete) return
    
    setDeletingRestaurant(true)
    try {
      const result = await deleteRestaurant(restaurantToDelete)
      if (result.success) {
        toast.success(t?.messages?.deleteSuccess || "Restaurant deleted successfully")
        // Update local data
        setData(data.filter(restaurant => restaurant.id !== restaurantToDelete))
      } else {
        toast.error(result.message || t?.errors?.deleteFailed || "Failed to delete restaurant")
      }
    } catch (err) {
      console.error(err)
      toast.error(t?.errors?.unexpected || "An unexpected error occurred")
    } finally {
      setDeletingRestaurant(false)
      setDeleteDialogOpen(false)
      setRestaurantToDelete(null)
      setRestaurantNameToDelete(null)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    
    // Convert to days
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days < 1) {
      return t?.timeFormatting?.today || "Today"
    } else if (days < 2) {
      return t?.timeFormatting?.yesterday || "Yesterday"
    } else if (days < 7) {
      return (t?.timeFormatting?.daysAgo || "{days} days ago").replace("{days}", days.toString())
    } else if (days < 30) {
      const weeks = Math.floor(days / 7)
      return (t?.timeFormatting?.weeksAgo || "{weeks} weeks ago").replace("{weeks}", weeks.toString())
    } else if (days < 365) {
      const months = Math.floor(days / 30)
      return (t?.timeFormatting?.monthsAgo || "{months} months ago").replace("{months}", months.toString())
    } else {
      const years = Math.floor(days / 365)
      return (t?.timeFormatting?.yearsAgo || "{years} years ago").replace("{years}", years.toString())
    }
  }

  const columns: ColumnDef<RestaurantWithStats>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t?.aria?.selectAll || "Select all"}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t?.aria?.selectRow || "Select row"}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t?.columns?.name || "Name"}
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t?.columns?.created || "Created"}
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date
        return <div>{formatDate(date)}</div>
      },
    },
    {
      accessorKey: "weeklyVisits",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t?.columns?.weeklyVisits || "Weekly Visits"}
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const visits = parseInt(row.getValue("weeklyVisits"))
        return <div className="font-medium">{visits.toLocaleString()}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const restaurant = row.original

        return (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                toast.error(t?.errors?.editNotImplemented || "Edit functionality is not yet implemented")
              }}
            >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">{t?.actions?.edit || "Edit"}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDelete(restaurant.id, restaurant.name)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">{t?.actions?.delete || "Delete"}</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (loading) {
    return <div className="flex justify-center items-center min-h-[200px]">{t?.states?.loading || "Loading restaurants..."}</div>
  }

  if (error) {
    return <div className="text-red-500 text-center">{t?.states?.error || "Error"}: {error}</div>
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex sm:flex-row flex-col items-center gap-2 py-4">
        <Input
          placeholder={t?.placeholders?.filterByName || "Filter by name..."}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="sm:ml-auto w-full sm:w-min">
              {t?.buttons?.columns || "Columns"} <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // Map column IDs to their translated labels
                const columnLabels: Record<string, string | undefined> = {
                  name: t?.columns?.name || "Name",
                  createdAt: t?.columns?.created || "Created", 
                  weeklyVisits: t?.columns?.weeklyVisits || "Weekly Visits"
                };
                
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                  {t?.states?.noRestaurants || "No restaurants found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex sm:flex-row flex-col justify-end items-center sm:space-x-2 space-y-2 sm:space-y-0 py-4">
        <div className="sm:flex-1 order-2 sm:order-1 text-muted-foreground text-sm">
          {(t?.pagination?.selectedCount || "{selected} of {total} row(s) selected")
            .replace("{selected}", table.getFilteredSelectedRowModel().rows.length.toString())
            .replace("{total}", table.getFilteredRowModel().rows.length.toString())}
        </div>
        <div className="space-x-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t?.pagination?.previous || "Previous"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t?.pagination?.next || "Next"}
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t?.deleteDialog?.title || "Delete Restaurant"}</DialogTitle>
            <DialogDescription>
              {(t?.deleteDialog?.description || 'Are you sure you want to delete "{name}"? This action cannot be undone.')
                .replace("{name}", restaurantNameToDelete || "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingRestaurant}
            >
              {t?.deleteDialog?.cancel || "Cancel"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deletingRestaurant}
            >
              {deletingRestaurant 
                ? (t?.deleteDialog?.deleting || "Deleting...") 
                : (t?.deleteDialog?.confirm || "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}