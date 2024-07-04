import React, { createContext, useCallback, useContext, useState } from "react"
import { getEndpoints } from "@zetachain/networks/dist/src/getEndpoints"
import debounce from "lodash/debounce"
import { useAccount } from "wagmi"

import { hexToBech32Address } from "@/lib/hexToBech32Address"

const StakingContext = createContext<any>(null)

export const StakingProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { address, isConnected } = useAccount()
  const [stakingDelegations, setStakingDelegations] = useState<any>([])
  const [stakingRewards, setStakingRewards] = useState<any>([])
  const [unbondingDelegations, setUnbondingDelegations] = useState<any>([])

  const fetchUnbondingDelegations = useCallback(
    debounce(async () => {
      try {
        if (!isConnected) {
          return setUnbondingDelegations([])
        }
        const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url
        const addr = hexToBech32Address(address as any, "zeta")
        const url = `${api}/cosmos/staking/v1beta1/delegators/${addr}/unbonding_delegations`
        const response = await fetch(url)
        const data = await response.json()
        setUnbondingDelegations(data.unbonding_responses)
      } catch (e) {
        console.error(e)
      }
    }, 500),
    [address, isConnected]
  )

  const fetchStakingDelegations = useCallback(
    debounce(async () => {
      try {
        if (!isConnected) {
          return setStakingDelegations([])
        }
        const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url
        const addr = hexToBech32Address(address as any, "zeta")
        const url = `${api}/cosmos/staking/v1beta1/delegations/${addr}`
        const response = await fetch(url)
        const data = await response.json()
        setStakingDelegations(data.delegation_responses)
      } catch (e) {
        console.error(e)
      }
    }, 500),
    [address, isConnected]
  )

  const fetchStakingRewards = useCallback(
    debounce(async () => {
      try {
        if (!isConnected) {
          return setStakingRewards([])
        }
        const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url
        const addr = hexToBech32Address(address as any, "zeta")
        const url = `${api}/cosmos/distribution/v1beta1/delegators/${addr}/rewards`
        const response = await fetch(url)
        const data = await response.json()
        setStakingRewards(data.rewards)
      } catch (e) {
        console.error(e)
      }
    }, 500),
    [address, isConnected]
  )

  return (
    <StakingContext.Provider
      value={{
        stakingDelegations,
        stakingRewards,
        unbondingDelegations,
        fetchUnbondingDelegations,
        fetchStakingDelegations,
        fetchStakingRewards,
      }}
    >
      {children}
    </StakingContext.Provider>
  )
}

export const useStakingContext = () => useContext(StakingContext)
