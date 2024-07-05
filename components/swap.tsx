"use client"

import { useEffect, useState } from "react"
import { useBalanceContext } from "@/context/BalanceContext"
import { useCCTXsContext } from "@/context/CCTXsContext"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { formatAddress } from "@/lib/utils"
import useAmountValidation from "@/hooks/swap/useAmountValidation"
import useCrossChainFee from "@/hooks/swap/useCrossChainFee"
import useDestinationAddress from "@/hooks/swap/useDestinationAddress"
import useDestinationAmount from "@/hooks/swap/useDestinationAmount"
import useSendTransaction from "@/hooks/swap/useSendTransaction"
import useSendType, {
  computeSendType,
  sendTypeDetails,
} from "@/hooks/swap/useSendType"
import useSwapErrors from "@/hooks/swap/useSwapErrors"
import useTokenSelection from "@/hooks/swap/useTokenSelection"
import { useZetaChainClient } from "@/hooks/useZetaChainClient"
import SwapLayout from "@/components/SwapLayout"

const omnichainSwapContractAddress =
  "0xb459F14260D1dc6484CE56EB0826be317171e91F"

const Swap = () => {
  const { client } = useZetaChainClient()
  const { isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const { setInbounds, inbounds } = useCCTXsContext()
  const { balancesLoading, bitcoinAddress } = useBalanceContext()
  const { chain } = useNetwork()
  const { address } = useAccount()

  const [sourceAmount, setSourceAmount] = useState<number | boolean>(false)
  const [sourceTokenOpen, setSourceTokenOpen] = useState(false)
  const [destinationTokenOpen, setDestinationTokenOpen] = useState(false)
  const [isRightChain, setIsRightChain] = useState(true)
  const [isFeeOpen, setIsFeeOpen] = useState(false)
  const [sendButtonText, setSendButtonText] = useState("Send tokens")

  const {
    setSourceToken,
    sourceTokenSelected,
    sourceBalances,
    setDestinationToken,
    destinationTokenSelected,
    destinationBalances,
  } = useTokenSelection()

  const sendType = useSendType(sourceTokenSelected, destinationTokenSelected)

  const { crossChainFee } = useCrossChainFee(
    sourceTokenSelected,
    destinationTokenSelected,
    sendType
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
      sendType
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
    customAddressOpen,
    setCustomAddressOpen,
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
    omnichainSwapContractAddress,
    inbounds,
    setInbounds,
    bitcoinAddress,
    client
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
    <SwapLayout
      sendTypeDetails={sendTypeDetails}
      sendType={sendType}
      sourceAmount={sourceAmount}
      setSourceAmount={setSourceAmount}
      sourceTokenOpen={sourceTokenOpen}
      setSourceTokenOpen={setSourceTokenOpen}
      sourceTokenSelected={sourceTokenSelected}
      balancesLoading={balancesLoading}
      sourceBalances={sourceBalances}
      setSourceToken={setSourceToken}
      destinationAmount={destinationAmount}
      destinationAmountIsLoading={destinationAmountIsLoading}
      destinationTokenOpen={destinationTokenOpen}
      setDestinationTokenOpen={setDestinationTokenOpen}
      destinationTokenSelected={destinationTokenSelected}
      destinationBalances={destinationBalances}
      setDestinationToken={setDestinationToken}
      computeSendType={computeSendType}
      addressSelected={addressSelected}
      customAddressOpen={customAddressOpen}
      setCustomAddressOpen={setCustomAddressOpen}
      canChangeAddress={canChangeAddress}
      isAddressSelectedValid={isAddressSelectedValid}
      formatAddress={formatAddress}
      customAddress={customAddress}
      setCustomAddress={setCustomAddress}
      isCustomAddressValid={isCustomAddressValid}
      saveCustomAddress={saveCustomAddress}
      crossChainFee={crossChainFee}
      isFeeOpen={isFeeOpen}
      setIsFeeOpen={setIsFeeOpen}
      isRightChain={isRightChain}
      handleSend={handleSend}
      sendDisabled={sendDisabled}
      isSending={isSending}
      sendButtonText={sendButtonText}
      handleSwitchNetwork={handleSwitchNetwork}
      isLoading={isLoading}
      pendingChainId={pendingChainId}
    />
  )
}

export default Swap
