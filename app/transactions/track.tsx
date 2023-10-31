"use client"

import React, { useContext, useEffect, useState } from "react"
// @ts-ignore
import { trackCCTX } from "@zetachain/toolkit/helpers"
import EventEmitter from "eventemitter3"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"
import AppContext from "@/app/app"

const Track = ({ value }: any) => {
  const { inboundHash, desc } = value
  const [status, setStatus] = useState("searching")
  const { cctxs, setCCTXs, foreignCoins } = useContext(AppContext)

  const [details, setDetails] = useState("Searching...")

  useEffect(() => {
    const emitter = new EventEmitter()

    emitter
      .on("search-add", ({ text }) => {
        setStatus("searching")
        setDetails(text)
      })
      .on("succeed", ({ text }) => {
        setStatus("success")
        setDetails(text)
      })
      .on("fail", ({ text }) => {
        setStatus("failure")
        setDetails(text)
      })
      .on("add", ({ text }) => {
        setDetails(text)
      })

    const executeTracking = async () => {
      try {
        console.log(await trackCCTX(inboundHash, false, emitter))
      } catch (e) {}
    }

    executeTracking()

    return () => {
      emitter.removeAllListeners()
    }
  }, [])

  return (
    <TableRow key={value.inboundHash}>
      <TableCell className="w-[75px] align-top">
        <div className="flex justify-center p-2">
          {status === "searching" && <Loader2 className="animate-spin" />}
          {status === "success" && <CheckCircle2 className="text-green-500" />}
          {status === "failure" && <AlertTriangle className="text-red-500" />}
        </div>
      </TableCell>
      <TableCell className="pl-0">
        <div>{value.desc}</div>
        <small className="text-muted-foreground">{details}</small>
      </TableCell>
    </TableRow>
  )
}

export default Track
