"use client"

import React, { useContext } from "react"
import { getNetworkName } from "@zetachain/networks/dist/src/getNetworkName"
import { sendZETA } from "@zetachain/toolkit/helpers"
import { Loader2, Send } from "lucide-react"
import { useAccount, useNetwork } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AppContext from "@/app/app"

export default () => {
  const networks = [
    "goerli_testnet",
    "mumbai_testnet",
    "bsc_testnet",
    "zeta_testnet",
  ]

  const { cctxs, setCCTXs } = useContext(AppContext)

  const { address, isConnected } = useAccount()
  const [destinationNetwork, setDestinationNetwork] = React.useState("")

  const [amount, setAmount] = React.useState("")
  const [recipient, setRecipient] = React.useState("")

  React.useEffect(() => {
    setRecipient(address || "")
  }, [address])

  const { chain } = useNetwork()
  const signer = useEthersSigner()

  const currentNetworkName = chain ? getNetworkName(chain.network) : undefined

  const [isSending, setIsSending] = React.useState(false)

  const handleSend = async () => {
    setIsSending(true)

    if (!currentNetworkName) {
      setIsSending(false)
      throw new Error("Current network is not defined.")
    }

    if (!address) {
      setIsSending(false)
      throw new Error("Address undefined.")
    }

    if (signer && destinationNetwork && amount) {
      try {
        const tx = await sendZETA(
          signer,
          amount,
          currentNetworkName,
          destinationNetwork,
          address
        )
        const cctx = {
          inboundHash: tx.hash,
          desc: `Sent ${amount} ZETA to ${recipient} on ${destinationNetwork}`,
        }
        setCCTXs([cctx, ...cctxs])
      } catch (error) {
        console.error("Error sending ZETA:", error)
      } finally {
        setIsSending(false)
      }
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl mt-6 mb-4">
        ZETA Token Transfer
      </h1>
      <Card className="max-w-[450px] p-4">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <Select onValueChange={(e) => setDestinationNetwork(e)}>
            <SelectTrigger>
              <SelectValue placeholder="Destination network" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {networks.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input
            value={recipient}
            placeholder="Recipient address"
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Input
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in ZETA"
            type="number"
            step="any"
          />
          <Button
            variant="outline"
            type="submit"
            disabled={
              !isConnected || !destinationNetwork || !amount || isSending
            }
          >
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Tokens
          </Button>
        </form>
      </Card>
    </div>
  )
}