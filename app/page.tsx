"use client"

import { useContext } from "react"
import Link from "next/link"
import { MessageCircle, RefreshCw } from "lucide-react"
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
  const { isConnected } = useAccount()

  const refreshBalances = async () => {
    await fetchBalances(true)
  }

  function convertData(data: any[]): any[] {
    const result = {} as any

    for (const item of data) {
      const networkName = item.chain_name
      if (!result[networkName]) {
        result[networkName] = { networkName, native: "", zeta: "", zrc20: [] }
      }

      if (item.coin_type === "Gas") {
        result[networkName].native = parseFloat(item.balance).toFixed(2)
      }

      if (item.symbol === "ZETA" && item.coin_type === "ERC20") {
        result[networkName].zeta = parseFloat(item.balance).toFixed(2)
      }

      if (item.coin_type === "ZRC20") {
        const symbol = item.symbol.replace(`-${networkName}`, "")
        if (parseFloat(item.balance) > 0) {
          result[networkName].zrc20.push(
            `${parseFloat(item.balance).toFixed(2)} ${symbol}`
          )
        }
      }
    }

    for (const network of Object.keys(result)) {
      if (result[network].zrc20.length > 0) {
        result[network].zrc20 = result[network].zrc20.join(", ")
      } else {
        delete result[network].zrc20
      }
    }

    return Object.values(result)
  }

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-x-10">
        <div className="sm:col-span-2 overflow-x-scroll">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight mt-6 mb-4">
              Balances
            </h1>
            <Button
              size="icon"
              variant="ghost"
              className="mt-2"
              onClick={refreshBalances}
            >
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
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Network Name</TableHead>
                        <TableHead>Native</TableHead>
                        <TableHead>Zeta</TableHead>
                        <TableHead>ZRC20</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {convertData(balances).map((balance: any, index: any) => (
                        <TableRow key={index}>
                          <TableCell>{balance.networkName}</TableCell>
                          <TableCell>{balance.native || "N/A"}</TableCell>
                          <TableCell>{balance.zeta || "N/A"}</TableCell>
                          <TableCell>{balance.zrc20 || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
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
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight mt-6 mb-4">
            Send
          </h1>
          <Transfer />
        </div>
      </div>
    </div>
  )
}
