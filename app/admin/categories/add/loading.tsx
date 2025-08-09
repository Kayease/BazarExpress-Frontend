import { FormSkeleton } from '../../../../components/admin/AdminSkeletons';
import AdminLayout from '../../../../components/AdminLayout';

export default function Loading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Add Category</h1>
        </div>
        <FormSkeleton fields={6} hasImage={true} />
      </div>
    </AdminLayout>
  );
}