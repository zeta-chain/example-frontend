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

const TransactionsPage = () => {
  const { cctxs } = useContext(AppContext)

  return (
    <div>
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
                <Track key={cctx.inboundHash} value={cctx} />
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

export default TransactionsPage
