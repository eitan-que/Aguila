"use client";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { deleteCategoryAction, deleteProductAction, deleteDiscountAction } from "@/actions/resource-actions";
import { cn } from "@/lib/utils";

interface BaseItem { id: string; name: string }
interface DiscountItem { id: string; name: string; type?: string; value?: number }

interface Props {
  lang: string;
  restaurantId: string;
  categories: BaseItem[];
  products: BaseItem[];
  discounts: DiscountItem[];
  dict: {
    title: string;
    view: string;
    create: string;
    edit: string;
    del: string;
    selectPlaceholder: string;
    categories: string;
    products: string;
    discounts: string;
    confirm: string;
  };
}

export function ResourceManagers(props: Props) {
  return (
    <div className="flex flex-col gap-10">
      <ManageBlock type="category" {...props} items={props.categories} label={props.dict.categories} />
      <ManageBlock type="product" {...props} items={props.products} label={props.dict.products} />
      <ManageBlock type="discount" {...props} items={props.discounts} label={props.dict.discounts} />
    </div>
  );
}

function ManageBlock({
  type,
  items,
  label,
  restaurantId,
  lang,
  dict
}: Props & { type: "category" | "product" | "discount"; items: any[]; label: string }) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  const hasItems = items.length > 0;

  function onDelete(formData: FormData) {
    if (!selected) return;
    if (!confirm(dict.confirm)) return;
    startTransition(async () => {
      if (type === "category") {
        await deleteCategoryAction(formData);
      } else if (type === "product") {
        await deleteProductAction(formData);
      } else {
        await deleteDiscountAction(formData);
      }
      setSelected("");
    });
  }

  const basePath = `/${lang}/dashboard/restaurants/${restaurantId}`;
  const editHref = selected
    ? `${basePath}/${type === "category" ? "categories" : type === "product" ? "products" : "discounts"}/${selected}/edit`
    : "#";
  const newHref = `${basePath}/${type === "category" ? "categories" : type === "product" ? "products" : "discounts"}/new`;
  const listHref = `${basePath}/${type === "category" ? "categories" : type === "product" ? "products" : "discounts"}`;

  return (
    <div className="flex flex-col gap-4 bg-card p-4 border rounded-lg">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="font-semibold text-sm">{label} ({items.length})</h3>
        <div className="flex flex-wrap gap-2">
          <Link href={listHref} className="hover:bg-muted px-3 py-1.5 border rounded text-xs">
            {dict.view}
          </Link>
          <Link href={newHref} className="hover:bg-muted px-3 py-1.5 border rounded text-xs">
            {dict.create}
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <select
          className="bg-background px-2 py-2 border rounded text-sm"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">{dict.selectPlaceholder}</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>
              {i.name} {i.type ? `(${i.type})` : ""}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <Link
            aria-disabled={!selected}
            href={selected ? editHref : "#"}
            className={cn(
              "hover:bg-muted px-3 py-1.5 border rounded text-xs",
              !selected && "pointer-events-none opacity-40"
            )}
          >
            {dict.edit}
          </Link>
          <form action={onDelete}>
            <input type="hidden" name="id" value={selected} />
            <button
              type="submit"
              disabled={!selected || isPending}
              className="hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 px-3 py-1.5 border rounded text-red-600 text-xs disabled:cursor-not-allowed"
            >
              {isPending ? "…" : dict.del}
            </button>
          </form>
        </div>
        {!hasItems && (
          <p className="text-muted-foreground text-xs">
            {label} (0)
          </p>
        )}
      </div>
    </div>
  );
}