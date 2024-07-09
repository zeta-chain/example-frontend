"use client"

import { useEffect, useState } from "react"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import SwapLayout from "./Layout"
import useAmountValidation from "./hooks/useAmountValidation"
import useCrossChainFee from "./hooks/useCrossChainFee"
import useDestinationAddress from "./hooks/useDestinationAddress"
import useDestinationAmount from "./hooks/useDestinationAmount"
import useSendTransaction from "./hooks/useSendTransaction"
import useSendType, {
  computeSendType,
  sendTypeDetails,
} from "./hooks/useSendType"
import useSwapErrors from "./hooks/useSwapErrors"
import useTokenSelection from "./hooks/useTokenSelection"
import { formatAddress } from "./lib/utils"

interface SwapProps {
  contract: string
  client: any
  track?: any
  balances?: any
}

const Swap: React.FC<SwapProps> = ({
  contract,
  track,
  balances: balancesProp,
  client,
}) => {
  const { isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const { chain } = useNetwork()
  const { address } = useAccount()

  const bitcoinAddress = "" // temporary

  const [sourceAmount, setSourceAmount] = useState<string>("")
  const [isRightChain, setIsRightChain] = useState(true)
  const [sendButtonText, setSendButtonText] = useState("Send tokens")

  const [balances, setBalances] = useState<any>(balancesProp || [])
  const [balancesLoading, setBalancesLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchBalances = async () => {
      setBalancesLoading(true)
      try {
        const result = await client.getBalances({ evmAddress: address })
        setBalancesLoading(result)
      } catch (error) {
        console.error("Error fetching local balances:", error)
      } finally {
        setBalancesLoading(false)
      }
    }

    if (balancesProp) {
      setBalances(balancesProp)
      setBalancesLoading(false)
    } else {
      fetchBalances()
    }
  }, [balancesProp])

  const {
    setSourceToken,
    sourceTokenSelected,
    sourceBalances,
    setDestinationToken,
    destinationTokenSelected,
    destinationBalances,
  } = useTokenSelection(balances, bitcoinAddress)

  const sendType = useSendType(sourceTokenSelected, destinationTokenSelected)

  const { crossChainFee } = useCrossChainFee(
    sourceTokenSelected,
    destinationTokenSelected,
    client
  )

  const { isAmountGTFee, isAmountLTBalance } = useAmountValidation(
    sourceTokenSelected,
    sourceAmount,
    crossChainFee,
    sendType
  )

  const { destinationAmount, destinationAmountIsLoading } =
    useDestinationAmount(
      sourceTokenSelected,
      destinationTokenSelected,
      sourceAmount,
      crossChainFee,
      sendType,
      balances,
      client
    )

  const { priorityErrors } = useSwapErrors(
    sourceTokenSelected,
    destinationTokenSelected,
    sendType,
    sourceAmount,
    isAmountGTFee,
    isAmountLTBalance,
    destinationAmountIsLoading
  )

  const {
    addressSelected,
    isAddressSelectedValid,
    canChangeAddress,
    customAddress,
    setCustomAddress,
    isCustomAddressValid,
    saveCustomAddress,
  } = useDestinationAddress(address, destinationTokenSelected, bitcoinAddress)

  const { handleSend, isSending } = useSendTransaction(
    sendType,
    sourceTokenSelected,
    destinationTokenSelected,
    sourceAmount,
    addressSelected,
    setSourceAmount,
    contract,
    bitcoinAddress,
    client,
    track
  )

  const sendDisabled =
    !sendType ||
    !isAmountGTFee ||
    !isAmountLTBalance ||
    isSending ||
    !isAddressSelectedValid ||
    destinationAmountIsLoading ||
    !destinationAmount ||
    balancesLoading

  useEffect(() => {
    if (isSending) {
      setSendButtonText("Sending...")
    } else if (sendDisabled && priorityErrors.length > 0) {
      setSendButtonText(priorityErrors[0].message)
    } else {
      setSendButtonText("Send Tokens")
    }
  }, [isSending, sendDisabled, priorityErrors, destinationAmountIsLoading])

  useEffect(() => {
    if (sourceTokenSelected?.chain_name === "btc_testnet") {
      setIsRightChain(true)
    } else if (chain && sourceTokenSelected) {
      setIsRightChain(
        chain.id.toString() === sourceTokenSelected.chain_id.toString()
      )
    }
  }, [chain, sourceTokenSelected])

  const handleSwitchNetwork = async () => {
    const chain_id = sourceTokenSelected?.chain_id
    if (chain_id) {
      switchNetwork?.(chain_id)
    }
  }

  return (
    <div>
      <SwapLayout
        sendTypeDetails={sendTypeDetails}
        sendType={sendType}
        sourceAmount={sourceAmount}
        setSourceAmount={setSourceAmount}
        sourceTokenSelected={sourceTokenSelected}
        balancesLoading={balancesLoading}
        sourceBalances={sourceBalances}
        setSourceToken={setSourceToken}
        destinationAmount={destinationAmount}
        destinationAmountIsLoading={destinationAmountIsLoading}
        destinationTokenSelected={destinationTokenSelected}
        destinationBalances={destinationBalances}
        setDestinationToken={setDestinationToken}
        computeSendType={computeSendType}
        addressSelected={addressSelected}
        canChangeAddress={canChangeAddress}
        isAddressSelectedValid={isAddressSelectedValid}
        formatAddress={formatAddress}
        customAddress={customAddress}
        setCustomAddress={setCustomAddress}
        isCustomAddressValid={isCustomAddressValid}
        saveCustomAddress={saveCustomAddress}
        crossChainFee={crossChainFee}
        isRightChain={isRightChain}
        handleSend={handleSend}
        sendDisabled={sendDisabled}
        isSending={isSending}
        sendButtonText={sendButtonText}
        handleSwitchNetwork={handleSwitchNetwork}
        isLoading={isLoading}
        pendingChainId={pendingChainId}
      />
    </div>
  )
}

export default Swap
