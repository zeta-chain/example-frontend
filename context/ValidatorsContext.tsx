import React, { createContext, useCallback, useContext, useState } from "react"
import { getEndpoints } from "@zetachain/networks/dist/src/getEndpoints"
import debounce from "lodash/debounce"
import { useAccount } from "wagmi"

const ValidatorsContext = createContext<any>(null)

export const ValidatorsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { address, isConnected } = useAccount()
  const [validators, setValidators] = useState<any>([])
  const [validatorsLoading, setValidatorsLoading] = useState(false)
  const [observers, setObservers] = useState<any>([])

  const fetchValidators = useCallback(
    debounce(async () => {
      setValidatorsLoading(true)
      let allValidators: any[] = []
      let nextKey: any = null

      try {
        if (!isConnected) {
          setValidatorsLoading(false)
          setValidators([])
        }
        const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url

        const fetchBonded = async () => {
          const response = await fetch(`${api}/cosmos/staking/v1beta1/pool`)
          const data = await response.json()
          return data
        }

        const fetchPage = async (key: string) => {
          const endpoint = "/cosmos/staking/v1beta1/validators"
          const query = `pagination.key=${encodeURIComponent(key)}`
          const url = `${api}${endpoint}?${key && query}`

          const response = await fetch(url)
          const data = await response.json()

          allValidators = allValidators.concat(data.validators)

          if (data.pagination && data.pagination.next_key) {
            await fetchPage(data.pagination.next_key)
          }
        }
        const pool = (await fetchBonded())?.pool
        const tokens = parseInt(pool.bonded_tokens)
        await fetchPage(nextKey)
        allValidators = allValidators.map((v) => {
          return {
            ...v,
            voting_power: tokens ? (parseInt(v.tokens) / tokens) * 100 : 0,
          }
        })
      } catch (e) {
        console.error(e)
      } finally {
        setValidators(allValidators)
        setValidatorsLoading(false)
      }
    }, 500),
    [address, isConnected]
  )

  const fetchObservers = useCallback(
    debounce(async () => {
      try {
        const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url
        const url = `${api}/zeta-chain/observer/nodeAccount`
        const response = await fetch(url)
        const data = await response.json()
        setObservers(data.NodeAccount)
      } catch (e) {
        console.error(e)
      }
    }, 500),
    []
  )

  return (
    <ValidatorsContext.Provider
      value={{ validators, validatorsLoading, fetchValidators, fetchObservers }}
    >
      {children}
    </ValidatorsContext.Provider>
  )
}

export const useValidatorsContext = () => useContext(ValidatorsContext)
