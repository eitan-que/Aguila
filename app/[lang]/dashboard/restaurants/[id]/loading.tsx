import { PageSkeletonLayout } from "@/components/dashboard/skeletons";

export default function LoadingRestaurantDetail() {
  return <PageSkeletonLayout headerLines={1} metricBlocks={[6,7]} />;
}