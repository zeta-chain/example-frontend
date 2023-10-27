"use client"

import { useContext, useEffect } from "react"
import { getBalances } from "@zetachain/toolkit/helpers"
import { useAccount } from "wagmi"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
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
import Transactions from "@/app/transactions/page"

export default function IndexPage() {
  const { balances, balancesLoading } = useContext(AppContext)
  const { address, isConnected } = useAccount()

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-x-10">
        <div className="sm:col-span-2 overflow-x-scroll">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight mt-6 mb-4">
            Balances
          </h1>
          {balancesLoading ? (
            <p>Loading...</p>
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
                      {balances.map((balance: any, index: any) => (
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
              ) : (
                <Alert>
                  <AlertTitle>Connect wallet</AlertTitle>
                  <AlertDescription>
                    Please, connect wallet to see token balances.
                  </AlertDescription>
                </Alert>
              )}
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight mt-6 mb-4">
                Cross-Chain Transactions
              </h1>
              <Transactions />
            </>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight mt-6 mb-4">
            ZETA Token Transfer
          </h1>
          <Transfer />
        </div>
      </div>
    </div>
  )
}
