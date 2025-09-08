import { Card } from "@/components/ui/card";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

type Props = {
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  coordinates?: { lat: number; lon: number } | null;
};

function buildMapsUrl(address?: string | null, coords?: { lat: number; lon: number } | null) {
  if (coords && typeof coords.lat === "number" && typeof coords.lon === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`;
  }
  if (address && address.trim().length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return "#";
}

export default function ContactInfoCard({ address, phone, email, website, coordinates }: Props) {
  const mapsUrl = buildMapsUrl(address ?? undefined, coordinates ?? undefined);
  const hasAddress = address || coordinates;

  return (
    <Card className="gap-4 grid grid-cols-1 sm:grid-cols-2 p-4 w-full">
      {hasAddress && (
        <div className="flex justify-start items-center gap-2 col-span-1">
          <Link href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center gap-2 cursor-pointer">
            <div className="flex justify-center items-center bg-[#22c55e] p-2 rounded-full transition-colors">
              <MapPin className="size-5 text-card" />
            </div>
            <p className="font-semibold text-card-foreground/70 line-clamp-1">{address ?? "Ver en Google Maps"}</p>
          </Link>
        </div>
      )}
      {phone && (
        <div className="flex justify-start items-center gap-2 col-span-1">
          <Link href={`tel:${phone}`} className="flex justify-center items-center gap-2 cursor-pointer">
            <div className="flex justify-center items-center bg-[#2563eb] p-2 rounded-full transition-colors">
              <Phone className="size-5 text-card" />
            </div>
            <p className="font-semibold text-card-foreground/70 line-clamp-1">{phone}</p>
          </Link>
        </div>
      )}
      {email && (
        <div className="flex justify-start items-center gap-2 col-span-1">
          <Link href={`mailto:${email}`} className="flex justify-center items-center gap-2 cursor-pointer">
            <div className="flex justify-center items-center bg-muted p-2 rounded-full transition-colors">
              <Mail className="size-5 text-card" />
            </div>
            <p className="font-semibold text-card-foreground/70 line-clamp-1">{email}</p>
          </Link>
        </div>
      )}
      {website && (
        <div className="flex justify-start items-center gap-2 col-span-1">
          <Link href={website} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center gap-2">
            <div className="flex justify-center items-center bg-[#f59e0b] p-2 rounded-full transition-colors">
              <Globe className="size-5 text-card" />
            </div>
            <p className="font-semibold text-card-foreground/70 line-clamp-1">{website.replace(/^https?:\/\//, "")}</p>
          </Link>
        </div>
      )}
    </Card>
  );
}