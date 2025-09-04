export default function LoadingRestaurantDiscounts() {
  return (
    <main className="flex flex-col gap-10 p-6">
      <header className="flex justify-between items-center">
        <div className="bg-muted rounded w-72 h-7" />
        <div className="bg-muted rounded w-16 h-6" />
      </header>
      <div className="space-y-6">
        <div className="bg-muted rounded w-full h-40 animate-pulse" />
        <div className="border rounded-lg divide-y animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-3">
              <div className="space-y-2">
                <div className="bg-muted rounded w-40 h-4" />
                <div className="bg-muted rounded w-28 h-3" />
              </div>
              <div className="bg-muted rounded w-12 h-3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}