"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import { fetchFees } from "@zetachain/toolkit/helpers"
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

const FeesPage = () => {
  const [fees, setFees] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { address } = useAccount()

  useEffect(() => {
    const fetchFee = async () => {
      setIsLoading(true)
      try {
        const result = await fetchFees(500000)
        setFees(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
      setIsLoading(false)
    }
    fetchFee()
  }, [address])

  return (
    <div>
      <h2 className="text-3xl font-extrabold leading-tight tracking-tight mt-6 mb-4 md:text-4xl">
        Omnichain Fees
      </h2>
      <div>(in native gas tokens of destination chain)</div>
      {error && <div>Error: {error.message}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Card className="max-w-[880px] my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network Name</TableHead>
                <TableHead>Total Fee</TableHead>
                <TableHead>Gas Fee</TableHead>
                <TableHead>Protocol Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees?.feesZEVM &&
                Object.entries(fees.feesZEVM).map(
                  ([network, feeDetails]: [string, any]) => (
                    <TableRow key={`omnichain-${network}`}>
                      <TableCell>{network}</TableCell>
                      <TableCell>{feeDetails.totalFee}</TableCell>
                      <TableCell>{feeDetails.gasFee}</TableCell>
                      <TableCell>{feeDetails.protocolFee}</TableCell>
                    </TableRow>
                  )
                )}
            </TableBody>
          </Table>
        </Card>
      )}
      <h2 className="text-3xl font-extrabold leading-tight tracking-tight mt-6 mb-4 md:text-4xl">
        Cross-Chain Messaging Fees
      </h2>
      <div>(in ZETA, gas limit: 500000)</div>
      {error && <div>Error: {error.message}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Card className="max-w-[880px] my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network Name</TableHead>
                <TableHead>Total Fee</TableHead>
                <TableHead>Gas Fee</TableHead>
                <TableHead>Protocol Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees?.feesCCM &&
                Object.entries(fees.feesCCM).map(
                  ([network, feeDetails]: [string, any]) => (
                    <TableRow key={`ccm-${network}`}>
                      <TableCell>{network}</TableCell>
                      <TableCell>{feeDetails.totalFee}</TableCell>
                      <TableCell>{feeDetails.gasFee}</TableCell>
                      <TableCell>{feeDetails.protocolFee}</TableCell>
                    </TableRow>
                  )
                )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

export default FeesPage
