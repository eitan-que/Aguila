import { PageSkeletonLayout } from "@/components/dashboard/skeletons";

export default function LoadingRestaurantProducts() {
  return <PageSkeletonLayout headerLines={1} metricBlocks={[1]} listRows={6} />;
}