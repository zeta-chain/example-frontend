"use client"

import { useContext, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AppContext } from "@/app/index"

const StakingPage = () => {
  const { validators, fetchValidators } = useContext(AppContext)

  useEffect(() => {
    fetchValidators()
  }, [])

  const ValidatorTable = () => {
    return (
      <Table>
        <TableHead>
          <TableRow className="border-none hover:bg-transparent">
            <TableHeader>Validator</TableHeader>
            <TableHeader>Voting power</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {validators.map((v: any) => {
            return (
              <TableRow key={v.operator_address} className="border-none">
                <TableCell className="pl-4 rounded-bl-xl rounded-tl-xl">
                  {v.description.moniker}
                </TableCell>
                <TableCell>{parseFloat(v.voting_power).toFixed(2)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <div>
      <h1 className="leading-10 text-2xl font-bold tracking-tight pl-4">
        Select a validator
      </h1>
      {validators.length > 0 ? <ValidatorTable /> : "Loading..."}
    </div>
  )
}

export default StakingPage
