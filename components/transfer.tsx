"use client"

import { use, useContext, useEffect, useState } from "react"
import { getNetworkName } from "@zetachain/networks/dist/src/getNetworkName"
import networks from "@zetachain/networks/dist/src/networks"
// @ts-ignore
import { fetchFees, sendZETA, sendZRC20 } from "@zetachain/toolkit/helpers"
import { AlertCircle, Loader2, Send } from "lucide-react"
import { set } from "react-hook-form"
import { useAccount, useNetwork } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const supportedTransfers = {
    ZETA: ["zeta_testnet", "bsc_testnet", "goerli_testnet", "mumbai_testnet"],
    gETH: ["zeta_testnet", "goerli_testnet"],
    tBNB: ["zeta_testnet", "bsc_testnet"],
    tMATIC: ["zeta_testnet", "mumbai_testnet"],
    tBTC: ["zeta_testnet", "btc_testnet"],
  }

  function isValidTransfer(token: string, network: string) {
    const t = token as keyof typeof supportedTransfers
    if (!supportedTransfers[t]) {
      return false
    }
    return supportedTransfers[t].includes(network)
  }

  const networkList = Object.values(supportedTransfers)
    .reduce((acc, networks) => acc.concat(networks), [])
    .filter((value, index, self) => self.indexOf(value) === index)

  const [networkListFiltered, setNetworkListFiltered] = useState([])
  const [destinationNetwork, setDestinationNetwork] = useState<any>("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [destinationNetworkList, setDestinationNetworkList] = useState<any>([])
  const [sourceToken, setSourceToken] = useState("")
  const [fees, setFees] = useState<any>(null)
  const [amountLessThanFees, setAmountLessThanFees] = useState(false)
  const [foreignCoinsList, setForeignCoinsList] = useState<any>([])
  const [sourceNetworkSelected, setSourceNetworkSelected] = useState<any>("")
  const [sourceNetworkList, setSourceNetworkList] = useState<any>([])

  const [amount, setAmount] = useState("")
  const [isSending, setIsSending] = useState(false)

  const { address, isConnected } = useAccount()
  const { foreignCoins, inbounds, setInbounds, bitcoinAddress } =
    useContext(AppContext)
  const { chain } = useNetwork()
  const signer = useEthersSigner()

  const sourceNetwork = chain ? getNetworkName(chain.network) : undefined

  const sourceNetworkChainID =
    networks[sourceNetwork as keyof typeof networks]?.chain_id

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const result = await fetchFees(500000)
        setFees(result as any)
      } catch (err) {
        console.error(err)
      }
    }
    fetchFee()
  }, [address])

  useEffect(() => {
    let list = [sourceNetwork]
    if (bitcoinAddress) {
      list.push("btc_testnet")
    }
    setSourceNetworkList(list)
  }, [bitcoinAddress, sourceNetwork])

  useEffect(() => {
    setDestinationNetwork("")
  }, [sourceNetworkSelected])

  useEffect(() => {
    const transferrableTokens = []

    for (let token in supportedTransfers) {
      let t = token as keyof typeof supportedTransfers
      if (
        supportedTransfers[t].includes(sourceNetworkSelected) &&
        supportedTransfers[t].includes(destinationNetwork) &&
        sourceNetworkSelected !== destinationNetwork
      ) {
        transferrableTokens.push(token)
      }
    }
    setSourceToken("")
    setForeignCoinsList(transferrableTokens)
  }, [sourceNetworkSelected, destinationNetwork])

  useEffect(() => {
    if (
      sourceNetwork &&
      sourceNetwork !== "zeta_testnet" &&
      destinationNetwork &&
      destinationNetwork !== "zeta_testnet" &&
      sourceToken === "ZETA" &&
      amount &&
      parseFloat(amount) <
        parseFloat(fees?.feesCCM[destinationNetwork]?.totalFee)
    ) {
      setAmountLessThanFees(true)
    } else {
      setAmountLessThanFees(false)
    }
  }, [amount, destinationNetwork, sourceToken])

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
        if (sourceToken === "tBTC" && destinationNetwork === "zeta_testnet") {
          const a = parseFloat(amount) * 1e8
          const bitcoinTSSAddress = "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
          const memo = `hex::${address.replace(/^0x/, "")}`
          window.xfi.bitcoin.request(
            {
              method: "transfer",
              params: [
                {
                  feeRate: 10,
                  from: bitcoinAddress,
                  recipient: bitcoinTSSAddress,
                  amount: {
                    amount: a,
                    decimals: 8,
                  },
                  memo,
                },
              ],
            },
            (error: any, hash: any) => {
              if (!error) {
                const inbound = {
                  inboundHash: hash,
                  desc: `Sent ${a} tBTC from ${sourceNetworkSelected} to ${destinationNetwork}`,
                }
                setInbounds([...inbounds, inbound])
              }
            }
          )
          return
        } else if (
          sourceToken === "tBTC" &&
          destinationNetwork === "btc_testnet"
        ) {
          const tx = await sendZRC20(
            signer,
            amount,
            sourceNetwork,
            destinationNetwork,
            bitcoinAddress,
            sourceToken
          )
          const inbound = {
            inboundHash: tx.hash,
            desc: `Sent ${amount} ${sourceToken} from ${sourceNetworkSelected} to ${destinationNetwork}`,
          }
          setInbounds([...inbounds, inbound])
        } else if (sourceToken === "ZETA") {
          const tx = await sendZETA(
            signer,
            amount,
            sourceNetwork,
            destinationNetwork,
            address
          )
          const inbound = {
            inboundHash: tx.hash,
            desc: `Sent ${amount} ZETA from ${sourceNetworkSelected} to ${destinationNetwork}`,
          }
          setInbounds([...inbounds, inbound])
        } else {
          const tx = await sendZRC20(
            signer,
            amount,
            sourceNetwork,
            destinationNetwork,
            destinationAddress,
            sourceToken
          )
          const inbound = {
            inboundHash: tx.hash,
            desc: `Sent ${amount} ${sourceToken} from ${sourceNetworkSelected} to ${destinationNetwork}`,
          }
          setInbounds([...inbounds, inbound])
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
          <Select
            disabled={isSending}
            onValueChange={(e) => setSourceNetworkSelected(e)}
            value={sourceNetworkSelected}
          >
            <SelectTrigger>
              <SelectValue placeholder="Source network" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sourceNetworkList.map((network: any) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            className="col-span-2"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            value={amount}
            disabled={isSending}
            type="number"
            step="any"
          />{" "}
          <Select
            disabled={
              !isConnected ||
              isSending ||
              !sourceNetworkSelected ||
              !destinationNetwork ||
              foreignCoinsList.length === 0
            }
            onValueChange={(e) => setSourceToken(e)}
            value={sourceToken}
          >
            <SelectTrigger>
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {foreignCoinsList.map((token: any) => (
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
            disabled={isSending}
            onValueChange={(e) => setDestinationNetwork(e)}
            value={destinationNetwork}
          >
            <SelectTrigger>
              <SelectValue placeholder="Destination network" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {networkList
                  .filter((n: any) => n !== sourceNetworkSelected)
                  .map((n: any) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          type="submit"
          disabled={
            !isConnected ||
            !destinationNetwork ||
            !sourceToken ||
            !amount ||
            isSending ||
            amountLessThanFees
          }
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Tokens
        </Button>
        {amountLessThanFees && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Amount should be more than the fee: <br />
              {fees?.feesCCM[destinationNetwork]?.totalFee}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}

export default Transfer
