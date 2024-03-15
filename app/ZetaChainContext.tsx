import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import { ZetaChainClient } from "@zetachain/toolkit/client"

import { useEthersSigner } from "@/lib/ethers"

const ZetaChainContext = createContext<{ client: ZetaChainClient } | undefined>(
  undefined
)

interface ZetaChainProviderProps {
  children: ReactNode
}

export function ZetaChainProvider({ children }: ZetaChainProviderProps) {
  const [client, setClient] = useState<ZetaChainClient>()
  const signer = useEthersSigner()

  useEffect(() => {
    if (signer) {
      const newClient = new ZetaChainClient({
        network: "testnet",
        signer: signer,
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
      setClient(newClient)
    }
  }, [signer])

  if (!client) {
    return <div>Loading...</div>
  }

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
