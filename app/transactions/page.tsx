"use client"

import { useContext } from "react"
import { Divide } from "lucide-react"

import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AppContext from "@/app/app"

import Track from "./track"

export default () => {
  const { cctxs } = useContext(AppContext)

  return (
    <div>
      <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl mt-6 mb-4">
        Cross-Chain Transactions
      </h1>
      {cctxs.length > 0 ? (
        <Card className="max-w-[900px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cctxs.map((cctx: any, index: any) => (
                <Track value={cctx} />
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div>No recent transactions.</div>
      )}
    </div>
  )
}