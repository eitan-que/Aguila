"use client"

import { addRestaurantToCategory, listRestaurantsWithoutCategory, removeRestaurantFromCategory } from "@/actions/category"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Dictionary } from "@/actions/dictionaries"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Plus, Search } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Restaurant = {
  id: string
  name: string
  slug: string
  pictureUrl?: string | null
  createdAt: Date
}

type CategoryRestaurantsProps = {
  categoryId: string
  categoryName: string
  restaurants: Restaurant[]
  dict: Dictionary["dashboard"]["categories"]
}

export function CategoryRestaurants({
  categoryId,
  categoryName,
  restaurants: initialRestaurants,
  dict
}: CategoryRestaurantsProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants)
  const [availableRestaurants, setAvailableRestaurants] = useState<{id: string, name: string, slug: string}[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch available restaurants when dialog opens
  const fetchAvailableRestaurants = async () => {
    setIsLoading(true)
    try {
      const response = await listRestaurantsWithoutCategory()
      if (response.success && response.data) {
        setAvailableRestaurants(response.data)
      } else {
        toast.error(response.message || "Failed to load restaurants")
      }
    } catch (error) {
      console.error("Error fetching available restaurants:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // When dialog opens, fetch available restaurants and focus the input
  useEffect(() => {
    if (isDialogOpen) {
      fetchAvailableRestaurants()
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    } else {
      setSearchValue("")
    }
  }, [isDialogOpen])

  // Handle adding a restaurant to the category
  const handleAddRestaurant = async () => {
    if (!searchValue.trim()) return
    
    // Find restaurant by name or partial name match
    const restaurant = availableRestaurants.find(
      r => r.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    
    if (!restaurant) {
      toast.error(dict.categoryPage?.errors?.restaurantNotFound || "Restaurant not found")
      return
    }
    
    setIsLoading(true)
    try {
      const result = await addRestaurantToCategory(restaurant.id, categoryId)
      if (result.success) {
        // Add the restaurant to the local state
        setRestaurants(prev => [
          ...prev, 
          { 
            id: restaurant.id, 
            name: restaurant.name, 
            slug: restaurant.slug, 
            createdAt: new Date()
          }
        ])
        
        // Remove from available restaurants
        setAvailableRestaurants(prev => 
          prev.filter(r => r.id !== restaurant.id)
        )
        
        setSearchValue("")
        toast.success(
          dict.categoryPage?.messages?.restaurantAdded?.replace("{name}", restaurant.name) || 
          `${restaurant.name} added to category`
        )
      } else {
        toast.error(result.message || "Failed to add restaurant to category")
      }
    } catch (error) {
      console.error("Error adding restaurant to category:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle removing a restaurant from the category
  const handleRemoveRestaurant = async (id: string, name: string) => {
    setIsRemoving(id)
    try {
      const result = await removeRestaurantFromCategory(id)
      if (result.success) {
        setRestaurants(prev => prev.filter(r => r.id !== id))
        toast.success(
          dict.categoryPage?.messages?.restaurantRemoved?.replace("{name}", name) || 
          `${name} removed from category`
        )
      } else {
        toast.error(result.message || "Failed to remove restaurant from category")
      }
    } catch (error) {
      console.error("Error removing restaurant from category:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsRemoving(null)
    }
  }

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    try {
      const now = new Date()
      const createdAt = new Date(date)
      const diffTime = Math.abs(now.getTime() - createdAt.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return dict.list?.timeFormatting?.today || "Today"
      if (diffDays === 1) return dict.list?.timeFormatting?.yesterday || "Yesterday"
      if (diffDays < 7) return (dict.list?.timeFormatting?.daysAgo || "{days} days ago").replace("{days}", diffDays.toString())
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return (dict.list?.timeFormatting?.weeksAgo || "{weeks} weeks ago").replace("{weeks}", weeks.toString())
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return (dict.list?.timeFormatting?.monthsAgo || "{months} months ago").replace("{months}", months.toString())
      }
      
      const years = Math.floor(diffDays / 365)
      return (dict.list?.timeFormatting?.yearsAgo || "{years} years ago").replace("{years}", years.toString())
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Unknown date"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>{dict.categoryPage?.title || "Restaurants in Category"}</CardTitle>
            <CardDescription>
              {dict.categoryPage?.description || "Manage the restaurants in this category"}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                {dict.categoryPage?.addButton || "Add Restaurant"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dict.categoryPage?.addDialog?.title || "Add Restaurant to Category"}
                </DialogTitle>
                <DialogDescription>
                  {(dict.categoryPage?.addDialog?.description || "Search for a restaurant to add to {category}")
                    .replace("{category}", categoryName)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 gap-2 grid">
                  <Search className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2 transform" />
                  <Input
                    ref={searchInputRef}
                    placeholder={dict.categoryPage?.addDialog?.searchPlaceholder || "Search for restaurant by name"}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    list="available-restaurants"
                    disabled={isLoading}
                    className="pl-9"
                  />
                  <datalist id="available-restaurants">
                    {availableRestaurants.map(restaurant => (
                      <option key={restaurant.id} value={restaurant.name} />
                    ))}
                  </datalist>
                </div>
                <Button 
                  onClick={handleAddRestaurant}
                  disabled={isLoading || !searchValue.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  {dict.categoryPage?.addDialog?.closeButton || "Close"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {restaurants.length === 0 ? (
            <div className="py-6 text-muted-foreground text-center">
              {dict.categoryPage?.noRestaurants || "No restaurants in this category yet"}
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.categoryPage?.table?.columns?.name || "Name"}</TableHead>
                    <TableHead>{dict.categoryPage?.table?.columns?.added || "Added"}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {restaurant.pictureUrl && (
                            <div className="relative rounded-full w-8 h-8 overflow-hidden">
                              <Image
                                src={restaurant.pictureUrl}
                                alt={restaurant.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          {restaurant.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatRelativeTime(restaurant.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveRestaurant(restaurant.id, restaurant.name)}
                          disabled={isRemoving === restaurant.id}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">
                            {dict.categoryPage?.table?.removeButton || "Remove"}
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}