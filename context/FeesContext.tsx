import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import debounce from "lodash/debounce"
import { useAccount } from "wagmi"

import { useZetaChainClient } from "@/hooks/useZetaChainClient"

const FeesContext = createContext<any>(null)

export const FeesProvider = ({ children }: { children: React.ReactNode }) => {
  const { client } = useZetaChainClient()
  const { isConnected } = useAccount()
  const [fees, setFees] = useState<any>([])

  const fetchFeesList = useCallback(
    debounce(async () => {
      try {
        if (!isConnected) {
          return setFees([])
        }
        setFees(await client.getFees(500000))
      } catch (e) {
        console.error(e)
      }
    }, 500),
    [isConnected]
  )

  useEffect(() => {
    fetchFeesList()
  }, [isConnected])

  return (
    <FeesContext.Provider value={{ fees }}>{children}</FeesContext.Provider>
  )
}

export const useFeesContext = () => useContext(FeesContext)
