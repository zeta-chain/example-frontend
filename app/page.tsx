"use client"

import { useContext, useEffect, useState } from "react"
import Link from "next/link"
import { divide } from "lodash"
import {
  ArrowBigUp,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  RefreshCw,
  Zap,
} from "lucide-react"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Transfer from "@/components/transfer"
import { AppContext } from "@/app/index"

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

const BalancesTable = ({
  sortedBalances,
  showAll,
  toggleShowAll,
  stakingAmountTotal,
}: any) => {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="pl-4">Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBalances
            .slice(0, showAll ? sortedBalances.length : 5)
            .map((b: any, index: any) => (
              <TableRow key={index} className="border-none">
                <TableCell className="pl-4 rounded-bl-xl rounded-tl-xl">
                  <div>{b.ticker}</div>
                  <div className="text-xs text-gray-400">{b.chain_name}</div>
                </TableCell>
                <TableCell>{b.coin_type}</TableCell>
                <TableCell className="rounded-br-xl rounded-tr-xl text-right">
                  {parseFloat(b.balance).toFixed(2) || "N/A"}
                  {b.ticker === "ZETA" && b.coin_type === "Gas" && (
                    <div>
                      <Button
                        size="sm"
                        variant="link"
                        className="my-1 p-0 text-xs h-5"
                        asChild
                      >
                        <Link href="/staking">
                          <ArrowBigUp className="h-4 w-4 mr-0.5" />
                          {stakingAmountTotal > 0 ? (
                            <span>
                              Staking:&nbsp;
                              {parseFloat(
                                formatUnits(stakingAmountTotal, 18)
                              ).toFixed(0)}
                            </span>
                          ) : (
                            <span>Stake ZETA</span>
                          )}
                        </Link>
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {sortedBalances?.length > 5 && (
        <div className="my-4 flex justify-center">
          <Button variant="link" onClick={toggleShowAll}>
            {showAll ? "Collapse" : "Show all assets"}
            {showAll ? (
              <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-75" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-75" />
            )}
          </Button>
        </div>
      )}
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

export default function IndexPage() {
  const {
    balances,
    balancesLoading,
    balancesRefreshing,
    fetchBalances,
    stakingDelegations,
  } = useContext(AppContext)
  const [sortedBalances, setSortedBalances] = useState([])
  const [showAll, setShowAll] = useState(false)

  const { isConnected } = useAccount()

  const refreshBalances = async () => {
    await fetchBalances(true)
  }

  const toggleShowAll = () => {
    setShowAll(!showAll)
  }

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
      .filter((b: any) => {
        return b.balance > 0
      })
    setSortedBalances(balance)
  }, [balances])

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-x-10">
        <div className="sm:col-span-2 overflow-x-scroll">
          <div className="flex items-center justify-start gap-2 mt-12 mb-6">
            <h1 className="leading-10 text-2xl font-bold tracking-tight pl-4">
              Portfolio
            </h1>
            <Button size="icon" variant="ghost" onClick={refreshBalances}>
              <RefreshCw
                className={`h-4 w-4 ${
                  (balancesLoading || balancesRefreshing) && "animate-spin"
                }`}
              />
            </Button>
          </div>
          {balancesLoading ? (
            <LoadingSkeleton />
          ) : isConnected ? (
            <BalancesTable
              sortedBalances={sortedBalances}
              showAll={showAll}
              toggleShowAll={toggleShowAll}
              stakingAmountTotal={stakingAmountTotal}
            />
          ) : (
            <ConnectWallet />
          )}
          <div className="my-5 flex space-x-2">
            <Link href="/messaging" legacyBehavior passHref>
              <Button variant="outline">
                <MessageCircle className="mr-1 h-5 w-5" strokeWidth={1.5} />
                Cross-Chain Messaging
              </Button>
            </Link>
          </div>
        </div>
        <div className="mr-4">
          <Transfer />
        </div>
      </div>
    </div>
  )
}
