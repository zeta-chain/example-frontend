"use client"

import React, { useEffect, useState } from "react"
// @ts-ignore
import { trackCCTX } from "@zetachain/toolkit/helpers"
import EventEmitter from "eventemitter3"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"

const Track = ({ value }: any) => {
  const { inboundHash, desc } = value
  const [status, setStatus] = useState("searching")

  useEffect(() => {
    const emitter = new EventEmitter()

    emitter
      .on("search-add", () => setStatus("searching"))
      .on("succeed", () => setStatus("success"))
      .on("fail", () => setStatus("failure"))

    const executeTracking = async () => {
      try {
        await trackCCTX(inboundHash, false, emitter)
      } catch (e) {}
    }

    executeTracking()

    return () => {
      emitter.removeAllListeners()
    }
  }, [])

  return (
    <TableRow key={value.inboundHash}>
      <TableCell className="flex justify-center">
        {status === "searching" && <Loader2 className="animate-spin" />}
        {status === "success" && <CheckCircle2 className="text-green-500" />}
        {status === "failure" && <AlertTriangle className="text-red-500" />}
      </TableCell>
      <TableCell>{value.desc}</TableCell>
    </TableRow>
  )
}

export default Track
