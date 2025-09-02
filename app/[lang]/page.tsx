import { getDictionary, Lang, locales } from "@/actions/dictionaries"
import Header from "@/components/menu/header";
import Navbar from "@/components/menu/navbar/navbar";
import Searchbar from "@/components/menu/searchbar";
import Banner from "@/components/menu/sections/banner";
import Categories from "@/components/menu/sections/categories";
import Category, { Category as CategoryType } from "@/components/menu/sections/category";
import Restaurants, { Restaurant as RestaurantType } from "@/components/menu/sections/restaurants";
import { Home, User } from "lucide-react";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export const restaurants: RestaurantType[] = [
  {
    id: "1",
    name: "Restaurante 1",
    slug: "restaurante-1",
    picture: {
      src: "https://placehold.co/1690x840/png",
      alt: "Restaurante 1"
    },
    prepTimeRange: {
      min: 30,
      max: 60
    },
    highestPercentageDiscount: 30,
    weight: 1,
    categories: [
      {
        id: "1",
        name: "Categoria 1",
        weight: 5
      },
      {
        id: "2",
        name: "Categoria 2",
        weight: 2
      },
    ],
    tags: [
      { type: "text", text: "Vegetariano" },
      { type: "text", text: "Sin Gluten" },
      { type: "text", text: "Kosher" }
    ],
  },
  {
    id: "2",
    name: "Restaurante 2",
    slug: "restaurante-2",
    picture: {
      src: "https://placehold.co/1690x840/png",
      alt: "Restaurante 2"
    },
    prepTimeRange: {
      min: 20,
      max: 40
    },
    highestPercentageDiscount: 15,
    weight: 4,
    categories: [
      {
        id: "1",
        name: "Categoria 1",
        weight: 1
      },
      {
        id: "2",
        name: "Categoria 2",
        weight: 5
      },
    ],
    tags: [
      { type: "text", text: "Kosher" }
    ],
  },
  {
    id: "3",
    name: "Restaurante 3",
    slug: "restaurante-3",
    picture: {
      src: "https://placehold.co/1690x840/png",
      alt: "Restaurante 3"
    },
    prepTimeRange: {
      min: 10,
      max: 30
    },
    weight: 1,
    categories: [
      {
        id: "1",
        name: "Categoria 1",
        weight: 3
      },
      {
        id: "2",
        name: "Categoria 2",
        weight: 7
      },
    ],
    tags: [
    ],
  },
  {
    id: "4",
    name: "Restaurante 4",
    slug: "restaurante-4",
    picture: {
      src: "https://placehold.co/1690x840/png",
      alt: "Restaurante 4"
    },
    prepTimeRange: {
      min: 5,
      max: 15
    },
    weight: 8,
    tags: [
      { type: "text", text: "Sin Gluten" }
    ]
  },
  {
    id: "5",
    name: "Restaurante 5",
    slug: "restaurante-5",
    picture: {
      src: "https://placehold.co/1690x840/png",
      alt: "Restaurante 5"
    },
    prepTimeRange: {
      min: 15,
      max: 25
    },
    highestPercentageDiscount: 20,
    weight: 2,
    categories: [
      {
        id: "1",
        name: "Categoria 1",
        weight: 4
      },
      {
        id: "2",
        name: "Categoria 2",
        weight: 6
      },
    ],
    tags: [
      { type: "text", text: "Vegetariano" },
      { type: "text", text: "Sin Gluten" },
    ],
  }
];

export const categories: CategoryType[] = [
  {
    id: "cat-1",
    name: "Hamburguesas",
    picture: {
      src: "https://placehold.co/1200x400/png",
      alt: "Hamburguesas",
    },
    icon: {
      src: "https://placehold.co/40x40/png",
      alt: "Icono Hamburguesas",
    },
    weight: 10,
    products: [
      {
          id: "p-1",
          name: "Hamburguesa Clásica",
          description: "Doble carne, queso, lechuga y tomate.",
          picture: {
            src: "https://placehold.co/1340x980/png",
            alt: "Hamburguesa Clásica",
          },
          price: 28000,
          discount: { type: "percentage", value: 18 },
          tags: [
            { type: "text", text: "Popular" },
            { type: "text", text: "Nuevo" }
          ],
          rating: 4.7
      },
      {
          id: "p-2",
          name: "Hamburguesa BBQ",
          description: "Salsa BBQ, cebolla crispy y cheddar.",
          picture: {
            src: "https://placehold.co/1340x980/png",
            alt: "Hamburguesa BBQ",
          },
          price: 25000,
          discount: { type: "percentage", value: 12 },
          tags: [
            { type: "text", text: "BBQ" }
          ],
          rating: 4.3
      },
      {
          id: "p-3",
          name: "Veggie Burger",
          description: "Medallón de garbanzo, palta y rúcula.",
          picture: {
            src: "https://placehold.co/1340x980/png",
            alt: "Veggie Burger",
          },
          price: 22000,
          tags: [
            { type: "text", text: "Vegetariano" },
            { type: "text", text: "Sin Gluten" },
            { type: "text", text: "Nuevo" }
          ],
          rating: 4.9
      },
    ],
  },
  {
    id: "cat-2",
    name: "Pizzas",
    picture: {
      src: "https://placehold.co/1200x400/png",
      alt: "Pizzas",
    },
    icon: {
      src: "https://placehold.co/40x40/png",
      alt: "Icono Pizzas",
    },
    weight: 8,
    products: [
      {
        id: "p-4",
        name: "Muzzarella",
        description: "Clásica con mucha muzza.",
        picture: {
          src: "https://placehold.co/1340x980/png",
          alt: "Pizza Muzzarella",
        },
        price: 18000,
        tags: [
          { type: "text", text: "Clásico" }
        ],
        rating: 4.1
      },
      {
        id: "p-5",
        name: "Napolitana",
        description: "Tomate en rodajas, ajo y orégano.",
        picture: {
          src: "https://placehold.co/1340x980/png",
          alt: "Pizza Napolitana",
        },
        price: 21000,
        discount: { type: "percentage", value: 10 },
        tags: [
          { type: "text", text: "Promo" }
        ],
        rating: 4.4
      },
      {
        id: "p-6",
        name: "Fugazzeta",
        picture: {
          src: "https://placehold.co/1340x980/png",
          alt: "Pizza Fugazzeta",
        },
        price: 23000,
        tags: [
          { type: "text", text: "Queso" }
        ],
        rating: 4.0
      },
    ],
  },
  {
    id: "cat-3",
    name: "Empanadas",
    picture: {
      src: "https://placehold.co/1200x400/png",
      alt: "Empanadas",
    },
    icon: {
      src: "https://placehold.co/40x40/png",
      alt: "Icono Empanadas",
    },
    weight: 9,
    products: [
      {
        id: "e-1",
        name: "Jamón y Queso",
          description: "Clásica y cremosa.",
          picture: {
            src: "https://placehold.co/1340x980/png",
            alt: "Empanada Jamón y Queso"
          },
          price: 23000,
          discount: { type: "percentage", value: 10 },
          tags: [
            { type: "text", text: "Nuevo" },
            { type: "text", text: "Comida Rápida" }
          ],
          rating: 4.5
      },
      {
        id: "e-2",
        name: "Carne Cortada a Cuchillo",
        description: "Carne jugosa con especias suaves.",
        picture: {
          src: "https://placehold.co/1340x980/png",
          alt: "Empanada Carne"
        },
        price: 24000,
        tags: [
          { type: "text", text: "Tradicional" }
        ],
        rating: 4.6
      },
      {
        id: "e-3",
        name: "Humita",
        description: "Maíz, queso y un toque dulce.",
        picture: {
          src: "https://placehold.co/1340x980/png",
          alt: "Empanada Humita"
        },
        price: 22000,
        tags: [
          { type: "text", text: "Vegetariano" }
        ],
        rating: 4.2
      },
    ]
  }
];

export default async function Place({
  params,
}: {
  params: Promise<{ lang: Lang; orgSlug: string; teamSlug: string }>
}) {
  const { lang } = await params
  // Continue with your existing code
  const dict = await getDictionary(lang)

  return (
    <main className="flex flex-col justify-start items-start gap-8 p-5 w-full min-h-screen">
        <Header
          lang={lang}
        />
        <Searchbar placeholder={dict.menu.search.placeholder} />
        <Banner />
        <Restaurants
          sectionTitle={{
              title: dict.menu.sections.restaurants,
              viewAll: {
                  label: dict.menu.sections.viewAll,
              }
          }}
          lang={lang}
          restaurants={restaurants}
        />
        <Banner />
        <Categories
          sectionTitle={{
              title: dict.menu.sections.categories,
              viewAll: {
                  label: dict.menu.sections.viewAll,
              }
          }}
          lang={lang}
          categories={categories}
        />
        <Category
          lang={lang}
          variant="medium"
          category={categories[0]}
        />
        <Restaurants
          sectionTitle={{
              title: dict.menu.sections.restaurants,
              viewAll: {
                  label: dict.menu.sections.viewAll,
              }
          }}
          lang={lang}
          restaurants={restaurants}
          variant="secondary"
        />
        <Category
          lang={lang}
          variant="large"
          category={categories[1]}
        />
        <Navbar
          items={
            [
              {
                icon: Home,
                label: dict.navbar.home,
                url: `/${lang}/`,
                isActive: true
              },
              // {
              //   icon: NotepadText,
              //   label: dict.navbar.orders,
              //   url: `/${lang}/orders/`
              // },
              {
                icon: User,
                label: dict.navbar.profile,
                url: `/${lang}/profile/`
              }
            ]
          } 
        />
    </main>
  )
}