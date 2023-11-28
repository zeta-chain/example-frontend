"use client"

import { useContext, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, MessageCircle, RefreshCw } from "lucide-react"
import { useAccount } from "wagmi"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import AppContext from "@/app/app"

export default function IndexPage() {
  const { balances, balancesLoading, balancesRefreshing, fetchBalances } =
    useContext(AppContext)
  const [sortedBalances, setSortedBalances] = useState([])
  const [showAll, setShowAll] = useState(false)

  const { isConnected } = useAccount()

  const refreshBalances = async () => {
    await fetchBalances(true)
  }

  const toggleShowAll = () => {
    setShowAll(!showAll)
  }

  useEffect(() => {
    let balance = balances
      .sort((a: any, b: any) => {
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
            <div className="space-y-4">
              {Array(5)
                .fill(null)
                .map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
            </div>
          ) : (
            <>
              {isConnected ? (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="pl-4">Asset</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBalances
                        .slice(0, showAll ? sortedBalances.length : 5)
                        .map((b: any, index: any) => (
                          <TableRow key={index} className="border-none">
                            <TableCell className="pl-4 rounded-bl-xl rounded-tl-xl">
                              <div>{b.ticker}</div>
                              <div className="text-xs text-slate-400">
                                {b.chain_name}
                              </div>
                            </TableCell>
                            <TableCell>{b.coin_type}</TableCell>
                            <TableCell className="rounded-br-xl rounded-tr-xl">
                              {parseFloat(b.balance).toFixed(2) || "N/A"}
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
              ) : (
                <Alert>
                  <AlertTitle>Connect wallet</AlertTitle>
                  <AlertDescription>
                    Please, connect wallet to see token balances.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
          <div className="my-5">
            <Link href="/messaging" legacyBehavior passHref>
              <Button variant="outline">
                <MessageCircle className="mr-1 h-5 w-5" strokeWidth={1.5} />
                Cross-Chain Messaging Example
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
