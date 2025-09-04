import { FormSkeleton } from "@/components/dashboard/skeletons";

export default function LoadingNewRestaurant() {
  return <FormSkeleton groups={3} fieldsPerGroup={2} />;
}