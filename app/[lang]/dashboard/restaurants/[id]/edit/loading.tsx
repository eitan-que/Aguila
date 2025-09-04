import { FormSkeleton } from "@/components/dashboard/skeletons";

export default function LoadingEditRestaurant() {
  return <FormSkeleton groups={3} fieldsPerGroup={2} />;
}