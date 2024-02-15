// ZetaChainContext.tsx
import React, { ReactNode, createContext, useContext, useState } from "react"
// @ts-ignore
import { ZetaChainClient } from "@zetachain/toolkit/client"

const ZetaChainContext = createContext<any>(undefined!)

interface ZetaChainProviderProps {
  children: ReactNode
}

export function ZetaChainProvider({ children }: ZetaChainProviderProps) {
  const [client] = useState(
    () =>
      new ZetaChainClient({
        network: "testnet",
        chains: {
          zeta_testnet: {
            api: [{ url: "https://jsonrpc-t.zeta.nodestake.top", type: "evm" }], // temporary endpoint
          },
        },
      })
  )

  return (
    <ZetaChainContext.Provider value={{ client }}>
      {children}
    </ZetaChainContext.Provider>
  )
}

export function useZetaChain(): any {
  const context = useContext(ZetaChainContext)
  if (context === undefined) {
    throw new Error("useZetaChain must be used within a ZetaChainProvider")
  }
  return context
}
