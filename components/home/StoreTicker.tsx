'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Store {
  id: string
  name: string
  logo_url: string
  website_url?: string
  parent_network?: string
}

export default function StoreTicker() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stores/ticker')
      .then(res => res.json())
      .then(data => {
        setStores(data.stores || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Don't render if loading or no stores
  if (loading || stores.length === 0) return null

  // Duplicate array for seamless infinite scroll
  const duplicatedStores = [...stores, ...stores, ...stores]

  return (
    <section className="py-20 px-[5%] bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-white mb-4">
          Prices From Stores You <span className="text-green-500">Love</span>
        </h2>
        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          Compare prices across your favorite retailers in real-time
        </p>

        <div className="relative">
          {/* Gradient masks for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          {/* Scrolling container */}
          <div className="flex gap-20 items-center animate-ticker-scroll hover:pause-animation">
            {duplicatedStores.map((store, index) => (
              <div
                key={`${store.id}-${index}`}
                className="flex-shrink-0 hover:scale-110 transition-transform duration-300"
              >
                {store.website_url ? (
                  <a
                    href={store.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={store.name}
                  >
                    <Image
                      src={store.logo_url}
                      alt={store.name}
                      width={160}
                      height={64}
                      className="h-14 md:h-16 w-auto object-contain"
                    />
                  </a>
                ) : (
                  <Image
                    src={store.logo_url}
                    alt={store.name}
                    width={160}
                    height={64}
                    className="h-14 md:h-16 w-auto object-contain"
                    title={store.name}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
