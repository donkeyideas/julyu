import AdminSidebar from '@/components/admin-v2/Sidebar'

export default function AdminV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-black">
      <AdminSidebar />
      <main className="flex-1 ml-[280px] p-8">
        {children}
      </main>
    </div>
  )
}


