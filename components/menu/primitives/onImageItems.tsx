import QuantitySelector from "@/components/menu/primitives/quantitySelector";
import TagComponent from "@/components/menu/primitives/tag";

type Discount = {
    type: "percentage" | "fixed";
    value: number;
}

type ProductTag = {
    type: "text";
    text?: string;
}

type TagsDisplayProps = {
    tags?: ProductTag[];
    maxVisible?: number | null;
};

/**
 * Tags display component
 * Used to display product tags
 * @param tags - Array of tags
 * @param maxVisible - Maximum number of visible tags
 * @returns
 * JSX element
 */
function TagsDisplay({ tags = [], maxVisible }: TagsDisplayProps) {
    const unlimited = maxVisible == null || maxVisible <= 0;
    const visibleTags = unlimited ? tags : tags.slice(0, maxVisible);
    const hiddenCount = unlimited ? 0 : Math.max(tags.length - maxVisible, 0);

    return (
        <>
            {hiddenCount > 0 && (
                <TagComponent
                    tag={{
                        type: "text",
                        text: `+${hiddenCount}`
                    }}
                />
            )}
            {visibleTags.map((t, i) => (
                <TagComponent
                    key={`${t.text ?? "tag"}-${i}`}
                    tag={{
                        type: "text",
                        text: t.text
                    }}
                />
            ))}
        </>
    );
}

type OnImageItemsProps = {
    tags?: ProductTag[];
    maxVisible?: {
        withQuantity: number;
        regular: number;
    };
    discount?: Discount;
    modifyQuantity?: (quantity: number) => void;
};

/**
 * On image items component
 * Used to display tags, discount, and quantity selector on the product image
 * @param tags - Array of tags
 * @param maxVisible - Maximum number of visible tags
 * @param discount - Discount object
 * @param addToCart - Add to cart function
 * @returns
 * JSX element
 */
export default function OnImageItems({ tags = [], maxVisible, discount, modifyQuantity }: OnImageItemsProps) {
    return (
        <div className={`top-0 left-0 absolute flex flex-col ${modifyQuantity || !discount ? "justify-end" : "justify-between"} items-end gap-1 p-2 w-full h-full`}>
            {discount && !modifyQuantity && (
                <TagComponent
                    tag={{
                        type: "discount",
                        discount: discount
                    }}
                />
            )}
            <div className={`flex ${modifyQuantity ? "flex-wrap" : "flex-wrap-reverse"} justify-end items-center gap-1 w-auto`}>
                <TagsDisplay tags={tags} maxVisible={modifyQuantity ? maxVisible?.withQuantity : maxVisible?.regular} />
                {discount && modifyQuantity && (
                    <TagComponent
                        tag={{
                            type: "discount",
                            discount: discount
                        }}
                    />
                )}
            </div>
            {modifyQuantity && (
                <QuantitySelector
                    // initialValue={0}
                    // min={1}
                    // max={99}
                    onChange={(value) => modifyQuantity?.(value)}
                />
            )}
        </div>
    );
}