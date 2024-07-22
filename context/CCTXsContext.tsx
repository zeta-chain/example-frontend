import React, { createContext, useContext, useEffect, useState } from "react"
import EventEmitter from "eventemitter3"

import { useZetaChainClient } from "@/hooks/useZetaChainClient"

const CCTXsContext = createContext<any>(null)

export const CCTXsProvider = ({ children }: { children: React.ReactNode }) => {
  const { client } = useZetaChainClient()
  const [inbounds, setInbounds] = useState<any>([])
  const [cctxs, setCCTXs] = useState<any>([])

  const updateCCTX = (updatedItem: any) => {
    setCCTXs((prevItems: any) => {
      const index = prevItems.findIndex(
        (item: any) => item.inboundHash === updatedItem.inboundHash
      )

      if (index === -1) return prevItems

      const newItems = [...prevItems]
      newItems[index] = {
        ...newItems[index],
        ...updatedItem,
      }

      return newItems
    })
  }

  const trackTransaction = ({ hash, desc }: { hash: string; desc: string }) => {
    setInbounds([...inbounds, { inboundHash: hash, desc }])
  }

  useEffect(() => {
    const cctxList = cctxs.map((c: any) => c.inboundHash)
    for (let i of inbounds) {
      if (!cctxList.includes(i.inboundHash)) {
        const emitter = new EventEmitter()
        emitter
          .on("search-add", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "searching",
            })
          })
          .on("add", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "searching",
            })
          })
          .on("succeed", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "succeed",
            })
          })
          .on("fail", ({ text }) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              progress: text,
              status: "failed",
            })
          })
          .on("mined-success", (value) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              status: "mined-success",
              ...value,
            })
          })
          .on("mined-fail", (value) => {
            updateCCTX({
              inboundHash: i.inboundHash,
              status: "mined-fail",
              ...value,
            })
          })

        client.trackCCTX({ hash: i.inboundHash, json: false, emitter })
        setCCTXs([...cctxs, { inboundHash: i.inboundHash, desc: i.desc }])
      }
    }
  }, [inbounds])

  return (
    <CCTXsContext.Provider value={{ cctxs, inbounds, trackTransaction }}>
      {children}
    </CCTXsContext.Provider>
  )
}

export const useCCTXsContext = () => useContext(CCTXsContext)
