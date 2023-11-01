"use client"

import * as React from "react"
import { useContext, useEffect } from "react"
import { getNetworkName } from "@zetachain/networks/dist/src/getNetworkName"
import networks from "@zetachain/networks/dist/src/networks"
import { Loader2, Send } from "lucide-react"
import { useDebounce } from "use-debounce"
import {
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi"

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

const contracts: any = {
  goerli_testnet: "0x122F9Cca5121F23b74333D5FBd0c5D9B413bc002",
  mumbai_testnet: "0x392bBEC0537D48640306D36525C64442E98FA780",
  bsc_testnet: "0xc5d7437DE3A8b18f6380f3B8884532206272D599",
}

const MessagingPage = () => {
  const [message, setMessage] = React.useState("")
  const [debouncedMessage] = useDebounce(message, 500)

  const allNetworks = Object.keys(contracts)

  const [destinationNetwork, setDestinationNetwork] = React.useState("")

  const [destinationChainID, setDestinationChainID] = React.useState(null)

  const { chain } = useNetwork()
  const currentNetworkName = chain ? getNetworkName(chain.network) : undefined

  React.useEffect(() => {
    setDestinationChainID(
      (networks as any)[destinationNetwork]?.chain_id ?? null
    )
  }, [destinationNetwork])
  const { inbounds, setInbounds, foreignCoins } = useContext(AppContext)

  const {
    config,
    error: prepareError,
    isError: isPrepareError,
  } = usePrepareContractWrite({
    address: contracts[currentNetworkName || ""],
    abi: [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "destinationChainId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "message",
            type: "string",
          },
        ],
        name: "sendMessage",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ],
    value: BigInt("10000000000000000"),
    functionName: "sendMessage",
    args: [
      BigInt(destinationChainID !== null ? destinationChainID : 0),
      debouncedMessage,
    ],
  })

  const { data, write } = useContractWrite(config)

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  useEffect(() => {
    if (isSuccess && data) {
      const inbound = {
        inboundHash: data.hash,
        desc: `Message sent to ${destinationNetwork}`,
      }
      setInbounds([...inbounds, inbound])
    }
  }, [isSuccess, data])

  const availableNetworks = allNetworks.filter(
    (network) => network !== currentNetworkName
  )

  return (
    <div>
      <h1 className="text-2xl font-extrabold leading-tight tracking-tight mt-6 mb-4">
        Cross-Chain Message
      </h1>
      <Card className="max-w-[450px] p-4">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            write?.()
          }}
        >
          <Input disabled value={`${currentNetworkName}`} />
          <Select onValueChange={(e) => setDestinationNetwork(e)}>
            <SelectTrigger>
              <SelectValue placeholder="Destination network" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {availableNetworks.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input
            placeholder="Message"
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={isLoading || !write || !message || !currentNetworkName}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send message
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default MessagingPage
