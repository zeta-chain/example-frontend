"use client"

import { useEffect, useState } from "react"
import { getBalances } from "@zetachain/toolkit/helpers"
import { useAccount } from "wagmi"

import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function IndexPage() {
  const [balances, setBalances] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoading(true)
      try {
        const result = await getBalances(address)
        setBalances(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
      setIsLoading(false)
    }
    fetchBalances()
  }, [address])

  return (
    <div>
      <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl mt-6 mb-4">
        Balances
      </h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Card className="max-w-[900px]">
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
              {balances &&
                balances.map((balance: any, index: any) => (
                  <TableRow key={index}>
                    <TableCell>{balance.networkName}</TableCell>
                    <TableCell>{balance.native}</TableCell>
                    <TableCell>{balance.zeta || "N/A"}</TableCell>
                    <TableCell>{balance.zrc20 || "N/A"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
