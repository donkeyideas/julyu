export default function SetupRequiredPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-4xl font-black mb-6 text-green-500">Setup Required</h1>
          
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
              <h2 className="font-bold text-yellow-500 mb-2">⚠️ Supabase Not Configured</h2>
              <p className="text-gray-400">
                Please configure your Supabase credentials in <code className="bg-black px-2 py-1 rounded">.env.local</code>
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Required Environment Variables:</h3>
              <div className="bg-black rounded-lg p-4 font-mono text-sm space-y-2">
                <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
                <div>SUPABASE_SERVICE_ROLE_KEY=your_service_role_key</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">Setup Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-400">
                <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" className="text-green-500 hover:underline">supabase.com</a></li>
                <li>Get your credentials from Project Settings → API</li>
                <li>Copy <code className="bg-black px-2 py-1 rounded">.env.example</code> to <code className="bg-black px-2 py-1 rounded">.env.local</code></li>
                <li>Add your Supabase credentials to <code className="bg-black px-2 py-1 rounded">.env.local</code></li>
                <li>Run <code className="bg-black px-2 py-1 rounded">database/schema.sql</code> in Supabase SQL Editor</li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <a
                href="https://supabase.com"
                target="_blank"
                className="inline-block px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
              >
                Get Started with Supabase
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


