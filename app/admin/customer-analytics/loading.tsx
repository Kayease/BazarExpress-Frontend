import AdminLayout from "../../../components/AdminLayout"
import { Loader2 } from "lucide-react"

export default function CustomerAnalyticsLoading() {
  return (
    <AdminLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading customer analytics...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
