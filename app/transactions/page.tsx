"use client"

import { useContext } from "react"
import { Divide } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
        <Alert>
          <AlertTitle>No recent transactions</AlertTitle>
          <AlertDescription>
            There are no recent cross-chain transactions to show.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default TransactionsPage
