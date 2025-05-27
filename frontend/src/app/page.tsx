import AdminLayout from '@/components/layout/AdminLayout'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

export default function Home() {
  return (
    <AdminLayout>
      <DashboardOverview />
    </AdminLayout>
  )
}
