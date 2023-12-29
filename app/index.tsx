"use client"

import "@/styles/globals.css"
import { parse } from "path"
import { createContext, use, useCallback, useEffect, useState } from "react"
import { getEndpoints } from "@zetachain/networks/dist/src/getEndpoints"
import {
  fetchFees,
  getBalances,
  getPools,
  trackCCTX,
  // @ts-ignore
} from "@zetachain/toolkit/helpers"
import EventEmitter from "eventemitter3"
import debounce from "lodash/debounce"
import { useAccount } from "wagmi"

import { hexToBech32Address } from "@/lib/hexToBech32Address"
import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"

interface RootLayoutProps {
  children: React.ReactNode
}

export const AppContext = createContext<any>(null)

export default function Index({ children }: RootLayoutProps) {
  const [balances, setBalances] = useState<any>([])
  const [balancesLoading, setBalancesLoading] = useState(true)
  const [balancesRefreshing, setBalancesRefreshing] = useState(false)
  const [bitcoinAddress, setBitcoinAddress] = useState("")
  const [fees, setFees] = useState<any>([])
  const [pools, setPools] = useState<any>([])
  const [poolsLoading, setPoolsLoading] = useState(false)
  const [validators, setValidators] = useState<any>([])
  const [validatorsLoading, setValidatorsLoading] = useState(false)
  const [stakingDelegations, setStakingDelegations] = useState<any>([])
  const [stakingRewards, setStakingRewards] = useState<any>([])
  const [unbondingDelegations, setUnbondingDelegations] = useState<any>([])

  const { address, isConnected } = useAccount()

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

  const fetchValidators = useCallback(
    debounce(async () => {
      setValidatorsLoading(true)
      let allValidators: any[] = []
      let nextKey: any = null

      try {
        if (!isConnected) {
          setValidatorsLoading(false)
          return setValidators([])
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
        const tokens =
          parseInt(pool.bonded_tokens) + parseInt(pool.not_bonded_tokens)
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

  const fetchBalances = useCallback(
    debounce(async (refresh: Boolean = false, btc: any = null) => {
      refresh ? setBalancesRefreshing(true) : setBalancesLoading(true)
      try {
        if (!isConnected) {
          return setBalances([])
        }
        const b = await getBalances(address, btc)
        setBalances(b)
      } catch (e) {
        console.log(e)
      } finally {
        refresh ? setBalancesRefreshing(false) : setBalancesLoading(false)
      }
    }, 500),
    [isConnected, address]
  )

  const fetchFeesList = useCallback(
    debounce(async () => {
      try {
        if (!isConnected) {
          return setFees([])
        }
        setFees(await fetchFees(500000))
      } catch (e) {
        console.log(e)
      }
    }, 500),
    []
  )

  const fetchPools = useCallback(
    debounce(async () => {
      setPoolsLoading(true)
      try {
        setPools(await getPools())
      } catch (e) {
        console.log(e)
      } finally {
        setPoolsLoading(false)
      }
    }, 500),
    []
  )

  useEffect(() => {
    fetchBalances()
    fetchFeesList()
  }, [isConnected, address])

  const [inbounds, setInbounds] = useState<any>([])
  const [cctxs, setCCTXs] = useState<any>([])

  const updateCCTX = (updatedItem: any) => {
    setCCTXs((prevItems: any) => {
      const index = prevItems.findIndex(
        (item: any) => item.inboundHash === updatedItem.inboundHash
      )

      if (index === -1) return prevItems

      const newItems = [...prevItems]
      newItems[index] = {
        ...newItems[index],
        ...updatedItem,
      }

      return newItems
    })
  }

  useEffect(() => {
    const cctxList = cctxs.map((c: any) => c.inboundHash)
    for (let i of inbounds) {
      if (!cctxList.includes(i.inboundHash)) {
        const emitter = new EventEmitter()
        emitter
          .on("search-add", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "searching",
            })
          })
          .on("add", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "searching",
            })
          })
          .on("succeed", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "succeed",
            })
          })
          .on("fail", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "failed",
            })
          })
          .on("mined-success", (value) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              status: "mined-success",
              ...value,
            })
          })
          .on("mined-fail", (value) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              status: "mined-fail",
              ...value,
            })
          })

        trackCCTX(i.inboundHash, false, emitter)
        setCCTXs([...cctxs, { inboundHash: i.inboundHash, desc: i.desc }])
      }
    }
  }, [inbounds])

  return (
    <>
      <AppContext.Provider
        value={{
          cctxs,
          inbounds,
          balances,
          bitcoinAddress,
          balancesLoading,
          balancesRefreshing,
          fees,
          pools,
          poolsLoading,
          validators,
          fetchValidators,
          validatorsLoading,
          stakingDelegations,
          stakingRewards,
          setCCTXs,
          setInbounds,
          setBitcoinAddress,
          setBalances,
          fetchPools,
          fetchBalances,
          fetchStakingDelegations,
          fetchStakingRewards,
          unbondingDelegations,
          fetchUnbondingDelegations,
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <section className="container px-4 mt-4">{children}</section>
          </div>
          <Toaster />
        </ThemeProvider>
      </AppContext.Provider>
    </>
  )
}
