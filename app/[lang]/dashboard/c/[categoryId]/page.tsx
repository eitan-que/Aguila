import { getCategoryById, getRestaurantsByCategory } from "@/actions/category"
import { getDictionary, Lang } from "@/actions/dictionaries"
import { CategoryRestaurants } from "@/components/dashboard/categories/categoryRestaurants"
import { SiteHeader } from "@/components/dashboard/siteHeader"
import { notFound } from "next/navigation"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: Lang; categoryId: string }>;
}) {
  const { lang, categoryId } = await params
  const dict = await getDictionary(lang)
  
  let category
  try {
    category = await getCategoryById(categoryId)
  } catch (error) {
    console.error("Error fetching category by ID:", error)
    category = null
  } finally {
    if (!category?.success || !category?.data) {
      if (category?.message) {
        console.error("Category fetch error:", category.message)
      }
      if (category?.message === "Category not found") {
        notFound()
      }
      return (
        <>
          <SiteHeader title={dict.dashboard.categories.title} />
          <div className="flex flex-col flex-1 p-4">
            <header className="flex justify-between items-center mb-4">
              <h1 className="font-bold text-2xl">
                {dict.dashboard.categories.title}
              </h1>
            </header>
            <p className="text-red-500">Error loading category data. Please try again later.</p>
          </div>
        </>
      )
    }
  }
  
  // Get restaurants for this category
  const restaurantsResult = await getRestaurantsByCategory(categoryId)
  const restaurants = restaurantsResult.success ? restaurantsResult.data : []

  return (
    <>
      <SiteHeader title={category.data.name || dict.dashboard.categories.title} />
      <div className="flex flex-col flex-1 p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-2xl">
            {category.data.name}
          </h1>
        </header>
        <CategoryRestaurants
          categoryId={category.data.id}
          categoryName={category.data.name}
          restaurants={restaurants}
          dict={dict.dashboard.categories}
        />
      </div>
    </>
  )
}