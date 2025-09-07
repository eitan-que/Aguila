"use client"

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from "react"
import { toast } from "sonner"
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
import { CategoryWithStats, deleteCategory, listCategories } from "@/actions/category"
import { Dictionary } from "@/actions/dictionaries"

type CategoriesListProps = {
  t: Dictionary["dashboard"]["categories"]["list"]
}

export function CategoriesList({ t }: CategoriesListProps) {
  const params = useParams()
  const lang = params.lang as string
  
  const [data, setData] = useState<CategoryWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [categoryNameToDelete, setCategoryNameToDelete] = useState<string | null>(null)
  const [deletingCategory, setDeletingCategory] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const result = await listCategories()
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.message || t?.errors?.loadFailed || "Failed to load categories")
          toast.error(result.message || t?.errors?.loadFailed || "Failed to load categories")
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
    setCategoryToDelete(id)
    setCategoryNameToDelete(name)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return
    
    setDeletingCategory(true)
    try {
      const result = await deleteCategory(categoryToDelete)
      if (result.success) {
        toast.success(t?.messages?.deleteSuccess || "Category deleted successfully")
        // Update local data
        setData(data.filter(category => category.id !== categoryToDelete))
      } else {
        toast.error(result.message || t?.errors?.deleteFailed || "Failed to delete category")
      }
    } catch (err) {
      console.error(err)
      toast.error(t?.errors?.unexpected || "An unexpected error occurred")
    } finally {
      setDeletingCategory(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      setCategoryNameToDelete(null)
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

  const columns: ColumnDef<CategoryWithStats>[] = [
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
        <Link 
          href={`/${lang}/dashboard/c/${row.original.id}`} 
          className="font-medium hover:underline"
        >
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
      accessorKey: "restaurantCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t?.columns?.restaurantCount || "Restaurants"}
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const count = parseInt(row.getValue("restaurantCount"))
        return <div className="font-medium">{count.toLocaleString()}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const category = row.original

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
              onClick={() => handleDelete(category.id, category.name)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">{t?.actions?.delete || "Delete"}</span>
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
    return <div className="flex justify-center items-center min-h-[200px]">{t?.states?.loading || "Loading categories..."}</div>
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
                  restaurantCount: t?.columns?.restaurantCount || "Restaurants"
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
                  {t?.states?.noCategories || "No categories found."}
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
            <DialogTitle>{t?.deleteDialog?.title || "Delete Category"}</DialogTitle>
            <DialogDescription>
              {(t?.deleteDialog?.description || 'Are you sure you want to delete "{name}"? This action cannot be undone.')
                .replace("{name}", categoryNameToDelete || "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingCategory}
            >
              {t?.deleteDialog?.cancel || "Cancel"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deletingCategory}
            >
              {deletingCategory 
                ? (t?.deleteDialog?.deleting || "Deleting...") 
                : (t?.deleteDialog?.confirm || "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}