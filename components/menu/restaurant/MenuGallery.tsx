import Image from "next/image";

type Props = {
  images?: string[] | null;
};

export default function MenuGallery({ images }: Props) {
  const urls = Array.isArray(images) ? images.filter(Boolean) : [];
  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <Image
        src={urls[0]!}
        alt="Menú"
        sizes="100vw"
        width={0}
        height={0}
        style={{ width: "100%", height: "auto" }}
        className="rounded-md"
      />
    );
  }

  return (
    <div className="gap-3 grid grid-cols-2 w-full">
      {urls.map((src, i) => (
        <div key={i} className="w-full">
          <Image
            src={src}
            alt={`Menú ${i + 1}`}
            sizes="(max-width: 640px) 100vw, 50vw"
            width={0}
            height={0}
            style={{ width: "100%", height: "auto" }}
            className="rounded-md"
          />
        </div>
      ))}
    </div>
  );
}