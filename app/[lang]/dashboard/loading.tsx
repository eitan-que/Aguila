import { PageSkeletonLayout } from "@/components/dashboard/skeletons";

export default function DashboardLoading() {
  return (
    <PageSkeletonLayout
      headerLines={1}
      metricBlocks={[6,6,6,6]}
    />
  );
}
