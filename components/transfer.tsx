"use client"

import { useContext, useEffect, useState } from "react"
import { getNetworkName } from "@zetachain/networks/dist/src/getNetworkName"
import networks from "@zetachain/networks/dist/src/networks"
// @ts-ignore
import { sendZETA, sendZRC20 } from "@zetachain/toolkit/helpers"
import { Loader2, Send } from "lucide-react"
import { useAccount, useNetwork } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AppContext from "@/app/app"

const Transfer = () => {
  const networkList = [
    "goerli_testnet",
    "mumbai_testnet",
    "bsc_testnet",
    "zeta_testnet",
  ]

  const [networkListFiltered, setNetworkListFiltered] = useState([])
  const [destinationNetwork, setDestinationNetwork] = useState("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [sourceToken, setSourceToken] = useState("")

  const [amount, setAmount] = useState("")
  const [isSending, setIsSending] = useState(false)

  const { address, isConnected } = useAccount()
  const { cctxs, setCCTXs, foreignCoins } = useContext(AppContext)
  const { chain } = useNetwork()
  const signer = useEthersSigner()

  const sourceNetwork = chain ? getNetworkName(chain.network) : undefined

  const destinationNetworkChainID =
    networks[destinationNetwork as keyof typeof networks]?.chain_id

  const sourceNetworkChainID =
    networks[sourceNetwork as keyof typeof networks]?.chain_id

  useEffect(() => {
    setDestinationAddress(address || "")
  }, [address])

  useEffect(() => {
    if (sourceToken === "ZETA") {
      const n = networkList.filter((network) => network !== sourceNetwork)
      setNetworkListFiltered(n as any)
      setDestinationNetwork(n[0])
    } else {
      setNetworkListFiltered(["zeta_testnet"] as any)
      setDestinationNetwork("zeta_testnet")
    }
  }, [sourceNetwork, sourceToken])

  const foreignCoinsFiltered = [
    ...foreignCoins
      .filter(
        (token: any) =>
          token.foreign_chain_id == sourceNetworkChainID &&
          token.coin_type === "Gas"
      )
      .map((token: any) => token.symbol),
    "ZETA",
  ]

  const handleSend = async () => {
    setIsSending(true)

    if (!sourceNetwork) {
      setIsSending(false)
      throw new Error("Current network is not defined.")
    }

    if (!address) {
      setIsSending(false)
      throw new Error("Address undefined.")
    }

    if (signer && destinationNetwork && amount) {
      try {
        if (sourceToken === "ZETA") {
          const tx = await sendZETA(
            signer,
            amount,
            sourceNetwork,
            destinationNetwork,
            address
          )
          const cctx = {
            inboundHash: tx.hash,
            desc: `Sent ${amount} ZETA from ${sourceNetwork} to ${destinationNetwork}`,
          }
          setCCTXs([cctx, ...cctxs])
        } else {
          const tx = await sendZRC20(
            signer,
            amount,
            sourceNetwork,
            destinationNetwork,
            destinationAddress,
            sourceToken
          )
          const cctx = {
            inboundHash: tx.hash,
            desc: `Sent ${amount} ${sourceToken} from ${sourceNetwork} to ${destinationNetwork}`,
          }
          setCCTXs([cctx, ...cctxs])
        }
      } catch (error) {
        console.error("Error sending tokens:", error)
      } finally {
        setIsSending(false)
      }
    }
  }

  return (
    <div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <div>
          <Label>From</Label>
          <Input disabled value={sourceNetwork || "Please, connect wallet"} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            className="col-span-2"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            value={amount}
            type="number"
            step="any"
          />{" "}
          <Select onValueChange={(e) => setSourceToken(e)} value={sourceToken}>
            <SelectTrigger>
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {foreignCoinsFiltered.map((token: any) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Destination</Label>
          <Select
            disabled={!sourceToken}
            onValueChange={(e) => setDestinationNetwork(e)}
            value={destinationNetwork}
          >
            <SelectTrigger>
              <SelectValue placeholder="Destination network" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {networkListFiltered.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          type="submit"
          disabled={!isConnected || !destinationNetwork || !amount || isSending}
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Tokens
        </Button>
      </form>
    </div>
  )
}

export default Transfer
