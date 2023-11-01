"use client"

import React, { useContext, useEffect, useState } from "react"
// @ts-ignore
import { trackCCTX } from "@zetachain/toolkit/helpers"
import EventEmitter from "eventemitter3"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"
import AppContext from "@/app/app"

const Track = ({ value }: any) => {
  const { inboundHash, desc, progress, status, cctxs } = value

  return (
    <>
      <TableRow key={inboundHash}>
        <TableCell className="w-[75px] align-top">
          <div className="flex justify-center p-2">
            {status === "searching" ||
              (status === "success" && <Loader2 className="animate-spin" />)}
            {status === "mined-success" && (
              <CheckCircle2 className="text-green-500" />
            )}
            {status === "mined-fail" && (
              <AlertTriangle className="text-red-500" />
            )}
          </div>
        </TableCell>
        <TableCell className="pl-0">
          <div>{desc}</div>
          <small className="text-muted-foreground">{progress}</small>
        </TableCell>
      </TableRow>
    </>
  )
}

export default Track
