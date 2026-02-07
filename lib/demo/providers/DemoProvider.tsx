'use client'

import { createContext, useContext, ReactNode } from 'react'
import { DemoSession } from '../utils/demo-auth'

interface DemoContextType {
  session: DemoSession | null
  isDemo: true
}

const DemoContext = createContext<DemoContextType>({
  session: null,
  isDemo: true,
})

export const useDemo = () => useContext(DemoContext)

export function DemoProvider({
  children,
  session,
}: {
  children: ReactNode
  session: DemoSession | null
}) {
  return (
    <DemoContext.Provider value={{ session, isDemo: true }}>
      {children}
    </DemoContext.Provider>
  )
}
