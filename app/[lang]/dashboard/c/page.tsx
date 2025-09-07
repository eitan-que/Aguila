import { getDictionary, Lang, locales } from "@/actions/dictionaries";
import { DrawerDialogTemplate } from "@/components/dashboard/drawerDialogTemplate";
import { CreateCategoryForm } from "@/components/dashboard/forms/createCategory";
import { CategoriesList } from "@/components/dashboard/categories/categoriesList";
import { SiteHeader } from "@/components/dashboard/siteHeader";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ lang: Lang; }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader title={dict.dashboard.categories?.title || "Categories"} />
      <div className="flex flex-col flex-1 p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-2xl">
            {dict.dashboard.categories?.title || "Categories"}
          </h1>
          <DrawerDialogTemplate 
            triggerText={dict.dashboard.categories?.add?.trigger || "Add Category"}
            title={dict.dashboard.categories?.add?.title || "Add Category"}
            description={dict.dashboard.categories?.add?.description || "Add a new category to organize restaurants."}
            form={<CreateCategoryForm {...dict.dashboard.categories?.form} />}
          />
        </header>
        <CategoriesList t={dict.dashboard.categories?.list} />
      </div>
    </>
  )
}