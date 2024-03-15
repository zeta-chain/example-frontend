import React, { ReactNode, createContext, useContext, useState } from "react"
import { ZetaChainClient } from "@zetachain/toolkit/client"

const ZetaChainContext = createContext<{ client: ZetaChainClient } | undefined>(
  undefined
)

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
            api: [
              {
                url: `https://zetachain-athens-evm.blockpi.network/v1/rpc/${process.env.NEXT_PUBLIC_API_KEY}`,
                type: "evm",
              },
            ],
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

export function useZetaChain() {
  const context = useContext(ZetaChainContext)
  if (context === undefined) {
    throw new Error("useZetaChain must be used within a ZetaChainProvider")
  }
  return context
}
