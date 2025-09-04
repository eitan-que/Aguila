"use server";
import { deleteCategory } from "@/actions/category";
import { deleteProduct } from "@/actions/product";
import { deleteDiscount } from "@/actions/discount"; // Asegúrate de que exista
import { revalidatePath } from "next/cache";

export async function deleteCategoryAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await deleteCategory(id);
  revalidatePath("/");
}

export async function deleteProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await deleteProduct(id);
  revalidatePath("/");
}

export async function deleteDiscountAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  try {
    await deleteDiscount(id);
  } catch {
    // fallback silencioso
  }
  revalidatePath("/");
}