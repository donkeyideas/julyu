import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getLists() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: lists } = await supabase
    .from('shopping_lists')
    .select('*, list_items(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return lists || []
}

export default async function ListsPage() {
  const lists = await getLists()

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">My Shopping Lists</h1>
        <Link href="/dashboard/lists/new" className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600">
          + New List
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {lists.length > 0 ? (
          lists.map((list: any) => (
            <div key={list.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">{list.name}</h3>
              <div className="text-gray-500 mb-6">
                {list.list_items?.[0]?.count || 0} items
              </div>
              <Link
                href={`/dashboard/compare?listId=${list.id}`}
                className="block w-full py-3 text-center border border-gray-700 rounded-lg hover:border-green-500 transition"
              >
                Compare Prices
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No shopping lists yet. Create your first list to start comparing prices!
          </div>
        )}
      </div>
    </div>
  )
}


