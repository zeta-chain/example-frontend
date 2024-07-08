"use client"

import { useEffect, useState } from "react"
import { useBalanceContext } from "@/context/BalanceContext"
import { useCCTXsContext } from "@/context/CCTXsContext"
import { usePricesContext } from "@/context/PricesContext"
import { useStakingContext } from "@/context/StakingContext"
import { RefreshCw } from "lucide-react"
import { useAccount } from "wagmi"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Balances from "@/components/Balances"
import Swap from "@/components/Swap"

const LoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(null)
        .map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
    </div>
  )
}

const ConnectWallet = () => {
  return (
    <Alert>
      <AlertTitle>Connect wallet</AlertTitle>
      <AlertDescription>
        Please, connect wallet to see token balances.
      </AlertDescription>
    </Alert>
  )
}

const universalSwapContract = "0xb459F14260D1dc6484CE56EB0826be317171e91F"

export default function IndexPage() {
  const { stakingDelegations } = useStakingContext()
  const { prices } = usePricesContext()
  const { trackTransaction } = useCCTXsContext()

  const { balances, balancesLoading, balancesRefreshing, fetchBalances } =
    useBalanceContext()
  const [sortedBalances, setSortedBalances] = useState([])
  const [showAll, setShowAll] = useState(false)

  const { isConnected } = useAccount()

  const refreshBalances = async () => {
    await fetchBalances(true)
  }

  const toggleShowAll = () => {
    setShowAll(!showAll)
  }

  const balancesPrices = sortedBalances.map((balance: any) => {
    const normalizeSymbol = (symbol: string) => symbol.replace(/^[tg]/, "")
    const normalizedSymbol = normalizeSymbol(balance.symbol)
    const priceObj = prices.find(
      (price: any) => normalizeSymbol(price.symbol) === normalizedSymbol
    )
    return {
      ...balance,
      price: priceObj ? priceObj.price : null,
    }
  })

  const stakingAmountTotal = stakingDelegations.reduce((a: any, c: any) => {
    const amount = BigInt(c.balance.amount)
    return a + amount
  }, BigInt(0))

  useEffect(() => {
    let balance = balances
      .sort((a: any, b: any) => {
        // Prioritize ZETA
        if (a.ticker === "ZETA" && a.coin_type === "Gas") return -1
        if (b.ticker === "ZETA" && b.coin_type === "Gas") return 1
        if (a.coin_type === "Gas" && b.coin_type !== "Gas") return -1
        if (a.coin_type !== "Gas" && b.coin_type === "Gas") return 1
        return a.chain_name < b.chain_name ? -1 : 1
      })
      .filter((b: any) => b.balance > 0)
    setSortedBalances(balance)
  }, [balances])

  const balancesTotal = balancesPrices.reduce(
    (a: any, c: any) => a + parseFloat(c.balance),
    0
  )

  const formatBalanceTotal = (b: string) => {
    if (parseFloat(b) > 1000) {
      return parseInt(b).toLocaleString()
    } else {
      return parseFloat(b).toFixed(2)
    }
  }

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-x-10">
        <div className="sm:col-span-2 overflow-x-scroll mb-20">
          <div className="mt-12 mb-8">
            <div className="px-3 text-sm mb-1 text-gray-400">Total balance</div>
            <div className="flex items-center justify-start gap-1">
              <h1 className="px-3 text-4xl font-bold tracking-tight">
                ${formatBalanceTotal(balancesTotal)}
              </h1>
              <Button size="icon" variant="ghost" onClick={refreshBalances}>
                <RefreshCw
                  className={`h-4 w-4 ${
                    (balancesLoading || balancesRefreshing) && "animate-spin"
                  }`}
                />
              </Button>
            </div>
          </div>
          {balancesLoading ? (
            <LoadingSkeleton />
          ) : isConnected ? (
            <Balances
              balances={balancesPrices}
              showAll={showAll}
              toggleShowAll={toggleShowAll}
              stakingAmountTotal={stakingAmountTotal}
            />
          ) : (
            <ConnectWallet />
          )}
        </div>
        <div className="mr-4">
          <Swap contract={universalSwapContract} track={trackTransaction} />
        </div>
      </div>
    </div>
  )
}
