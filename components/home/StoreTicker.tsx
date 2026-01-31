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
    <section className="py-12 px-[5%] bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-gray-500 text-sm mb-8 uppercase tracking-wider font-medium">
          Prices from stores you love
        </p>

        <div className="relative">
          {/* Gradient masks for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          {/* Scrolling container */}
          <div className="flex gap-16 animate-ticker-scroll hover:pause-animation">
            {duplicatedStores.map((store, index) => (
              <div
                key={`${store.id}-${index}`}
                className="flex-shrink-0 grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
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
                      width={120}
                      height={48}
                      className="h-10 md:h-12 w-auto object-contain"
                    />
                  </a>
                ) : (
                  <Image
                    src={store.logo_url}
                    alt={store.name}
                    width={120}
                    height={48}
                    className="h-10 md:h-12 w-auto object-contain"
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
