"use client"

import { useContext, useEffect } from "react"
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
import Transfer from "@/components/transfer"
import AppContext from "@/app/app"

export default function IndexPage() {
  const { balances, balancesLoading } = useContext(AppContext)

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-x-10">
        <div className="sm:col-span-2 overflow-x-scroll">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter mt-6 mb-4">
            Balances
          </h1>
          {balancesLoading ? (
            <p>Loading...</p>
          ) : (
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
        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter mt-6 mb-4">
            ZETA Token Transfer
          </h1>
          <Transfer />
        </div>
      </div>
    </div>
  )
}
