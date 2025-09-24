"use client"

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
import { deleteRestaurant, getRestaurantById, listRestaurants, restaurantData, RestaurantWithStats } from "@/actions/restaurant"
import { toast } from "sonner"
import { Dictionary } from "@/actions/dictionaries"
import Link from "next/link"
import { useEffect, useState } from "react"
import { EditRestaurantForm } from "@/components/dashboard/forms/editRestaurant"

type RestaurantListProps = {
  t: Dictionary["dashboard"]["restaurants"]
}

export function RestaurantsList({ t }: RestaurantListProps) {
  const [data, setData] = useState<RestaurantWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(null)
  const [restaurantNameToDelete, setRestaurantNameToDelete] = useState<string | null>(null)
  const [deletingRestaurant, setDeletingRestaurant] = useState(false)
  const [restaurantToEdit, setRestaurantToEdit] = useState<restaurantData | null>(null)
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await listRestaurants()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.message || t?.list.errors?.loadFailed || "Failed to load restaurants")
        toast.error(result.message || t?.list.errors?.loadFailed || "Failed to load restaurants")
      }
    } catch (err) {
      console.error(err)
      setError(t?.list.errors?.unexpected || "An unexpected error occurred")
      toast.error(t?.list.errors?.unexpected || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
        toast.success(t?.list.messages?.deleteSuccess || "Restaurant deleted successfully")
        // Update local data
        setData(data.filter(restaurant => restaurant.id !== restaurantToDelete))
      } else {
        toast.error(result.message || t?.list.errors?.deleteFailed || "Failed to delete restaurant")
      }
    } catch (err) {
      console.error(err)
      toast.error(t?.list.errors?.unexpected || "An unexpected error occurred")
    } finally {
      setDeletingRestaurant(false)
      setDeleteDialogOpen(false)
      setRestaurantToDelete(null)
      setRestaurantNameToDelete(null)
    }
  }

  const handleEdit = async (id: string) => {
    setIsLoadingRestaurant(true)
    try {
      const result = await getRestaurantById(id)
      if (result.success && result.data) {
        setRestaurantToEdit(result.data)
        setEditDialogOpen(true)
      } else {
        toast.error(result.message || t?.list.errors?.loadFailed || "Failed to load restaurant")
      }
    } catch (err) {
      console.error(err)
      toast.error(t?.list.errors?.unexpected || "An unexpected error occurred")
    } finally {
      setIsLoadingRestaurant(false)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    
    // Convert to days
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days < 1) {
      return t?.list.timeFormatting?.today || "Today"
    } else if (days < 2) {
      return t?.list.timeFormatting?.yesterday || "Yesterday"
    } else if (days < 7) {
      return (t?.list.timeFormatting?.daysAgo || "{days} days ago").replace("{days}", days.toString())
    } else if (days < 30) {
      const weeks = Math.floor(days / 7)
      return (t?.list.timeFormatting?.weeksAgo || "{weeks} weeks ago").replace("{weeks}", weeks.toString())
    } else if (days < 365) {
      const months = Math.floor(days / 30)
      return (t?.list.timeFormatting?.monthsAgo || "{months} months ago").replace("{months}", months.toString())
    } else {
      const years = Math.floor(days / 365)
      return (t?.list.timeFormatting?.yearsAgo || "{years} years ago").replace("{years}", years.toString())
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
          aria-label={t?.list.aria?.selectAll || "Select all"}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t?.list.aria?.selectRow || "Select row"}
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
          {t?.list.columns?.name || "Name"}
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link className="font-medium hover:underline" href={`/dashboard/r/${row.original.slug}`}>
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t?.list.columns?.created || "Created"}
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
          {t?.list.columns?.weeklyVisits || "Weekly Visits"}
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
              onClick={() => handleEdit(restaurant.id)}
              disabled={isLoadingRestaurant}
            >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">{t?.list.actions?.edit || "Edit"}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDelete(restaurant.id, restaurant.name)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">{t?.list.actions?.delete || "Delete"}</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

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
    return <div className="flex justify-center items-center min-h-[200px]">{t?.list.states?.loading || "Loading restaurants..."}</div>
  }

  if (error) {
    return <div className="text-red-500 text-center">{t?.list.states?.error || "Error"}: {error}</div>
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex sm:flex-row flex-col items-center gap-2 py-4">
        <Input
          placeholder={t?.list.placeholders?.filterByName || "Filter by name..."}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="sm:ml-auto w-full sm:w-min">
              {t?.list.buttons?.columns || "Columns"} <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // Map column IDs to their translated labels
                const columnLabels: Record<string, string | undefined> = {
                  name: t?.list.columns?.name || "Name",
                  createdAt: t?.list.columns?.created || "Created", 
                  weeklyVisits: t?.list.columns?.weeklyVisits || "Weekly Visits"
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
                  {t?.list.states?.noRestaurants || "No restaurants found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex sm:flex-row flex-col justify-end items-center sm:space-x-2 space-y-2 sm:space-y-0 py-4">
        <div className="sm:flex-1 order-2 sm:order-1 text-muted-foreground text-sm">
          {(t?.list.pagination?.selectedCount || "{selected} of {total} row(s) selected")
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
            {t?.list.pagination?.previous || "Previous"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t?.list.pagination?.next || "Next"}
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t?.list.deleteDialog?.title || "Delete Restaurant"}</DialogTitle>
            <DialogDescription>
              {(t?.list.deleteDialog?.description || 'Are you sure you want to delete "{name}"? This action cannot be undone.')
                .replace("{name}", restaurantNameToDelete || "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingRestaurant}
            >
              {t?.list.deleteDialog?.cancel || "Cancel"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deletingRestaurant}
            >
              {deletingRestaurant 
                ? (t?.list.deleteDialog?.deleting || "Deleting...") 
                : (t?.list.deleteDialog?.confirm || "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editDialogOpen && restaurantToEdit && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-lg overflow-hidden">
            <DialogHeader>
              <DialogTitle>{t?.list.editDialog?.title || "Edit Restaurant"}</DialogTitle>
              <DialogDescription>
                {t?.list.editDialog?.description || "Update restaurant information."}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-x-visible overflow-y-auto">
              <EditRestaurantForm 
                restaurant={{
                  id: restaurantToEdit.id,
                  name: restaurantToEdit.name ?? undefined,
                  slug: restaurantToEdit.slug ?? undefined,
                  description: restaurantToEdit.description ?? undefined,
                  address: restaurantToEdit.address ?? undefined,
                  lat: restaurantToEdit.lat ?? undefined,
                  lon: restaurantToEdit.lon ?? undefined,
                  pictureUrl: restaurantToEdit.pictureUrl ?? undefined,
                  pictureAlt: restaurantToEdit.pictureAlt ?? undefined,
                  prepTimeMin: restaurantToEdit.prepTimeMin ?? undefined,
                  prepTimeMax: restaurantToEdit.prepTimeMax ?? undefined,
                  tags: restaurantToEdit.tags ?? undefined,
                  website: restaurantToEdit.website ?? undefined,
                  phone: restaurantToEdit.phone ?? undefined,
                  email: restaurantToEdit.email ?? undefined,
                  menuPictureUrl: restaurantToEdit.menuPictureUrl ?? undefined,
                }}
                t={t.form}
                onSuccess={() => {
                  setEditDialogOpen(false)
                  // Refresh restaurant data
                  loadData()
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}