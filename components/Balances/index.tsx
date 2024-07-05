import Link from "next/link"
import { ArrowBigUp, ChevronDown, ChevronUp } from "lucide-react"
import { formatUnits } from "viem"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Balances = ({
  balances,
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
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances
            .slice(0, showAll ? balances.length : 5)
            .map((b: any, index: any) => (
              <TableRow key={index} className="border-none">
                <TableCell className="pl-4 rounded-bl-xl rounded-tl-xl">
                  <div>{b.ticker}</div>
                  <div className="text-xs text-gray-400">{b.chain_name}</div>
                </TableCell>
                <TableCell>{b.coin_type}</TableCell>
                <TableCell className="text-right">
                  {b.price?.toFixed(2)}
                </TableCell>
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
                              Staked:&nbsp;
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
      {balances?.length > 5 && (
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

export default Balances
