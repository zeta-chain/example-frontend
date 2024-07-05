"use client"

import { useEffect, useState } from "react"
import { useBalanceContext } from "@/context/BalanceContext"
import { useCCTXsContext } from "@/context/CCTXsContext"
import { bech32 } from "bech32"
import { ethers, utils } from "ethers"
import debounce from "lodash/debounce"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { formatAddress, roundNumber } from "@/lib/utils"
import useCrossChainFee from "@/hooks/swap/useCrossChainFee"
import useDestinationAmount from "@/hooks/swap/useDestinationAmount"
import useSendTransaction from "@/hooks/swap/useSendTransaction"
import useSendType, { computeSendType } from "@/hooks/swap/useSendType"
import useSwapErrors from "@/hooks/swap/useSwapErrors"
import useTokenSelection from "@/hooks/swap/useTokenSelection"
import { useZetaChainClient } from "@/hooks/useZetaChainClient"
import SwapLayout from "@/components/SwapLayout"

const Swap = () => {
  const { client } = useZetaChainClient()
  const omnichainSwapContractAddress =
    "0xb459F14260D1dc6484CE56EB0826be317171e91F"
  const { isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const { setInbounds, inbounds } = useCCTXsContext()
  const { balances, balancesLoading, bitcoinAddress } = useBalanceContext()
  const { chain } = useNetwork()

  const [sourceAmount, setSourceAmount] = useState<any>(false)
  const [sourceTokenOpen, setSourceTokenOpen] = useState(false)
  const [destinationTokenOpen, setDestinationTokenOpen] = useState(false)
  const [isRightChain, setIsRightChain] = useState(true)
  const [addressSelected, setAddressSelected] = useState<any>(null)
  const [isAddressSelectedValid, setIsAddressSelectedValid] = useState(false)
  const [canChangeAddress, setCanChangeAddress] = useState(false)
  const [customAddress, setCustomAddress] = useState("")
  const [customAddressSelected, setCustomAddressSelected] = useState("")
  const [customAddressOpen, setCustomAddressOpen] = useState(false)
  const [isCustomAddressValid, setIsCustomAddressValid] = useState(false)
  const [isAmountGTFee, setIsAmountGTFee] = useState(false)
  const [isAmountLTBalance, setIsAmountLTBalance] = useState(false)
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

  const { destinationAmount, destinationAmountIsLoading } =
    useDestinationAmount(
      sourceTokenSelected,
      destinationTokenSelected,
      sourceAmount,
      crossChainFee,
      sendType
    )

  const { updateError, priorityErrors } = useSwapErrors(
    sourceTokenSelected,
    destinationTokenSelected,
    sendType,
    sourceAmount,
    isAmountGTFee,
    isAmountLTBalance,
    destinationAmountIsLoading
  )

  const { handleSend, isSending } = useSendTransaction(
    sourceTokenSelected,
    destinationTokenSelected,
    sourceAmount,
    addressSelected,
    setSourceAmount,
    crossChainFee,
    omnichainSwapContractAddress,
    inbounds,
    setInbounds,
    bitcoinAddress,
    client
  )

  const { address } = useAccount()

  // Set whether address can be changed
  useEffect(() => {
    setCanChangeAddress(
      [
        "transferNativeEVM",
        "transferERC20EVM",
        "crossChainSwap",
        "transferBTC",
      ].includes(sendType as any)
    )
  }, [sourceAmount, sendType, destinationTokenSelected])

  const getQuoteCrossChain = async (
    s: any,
    d: any,
    sourceAmount: any,
    withdraw: boolean
  ) => {
    const dIsZRC20 = d?.zrc20 || (d?.coin_type === "ZRC20" && d?.contract)
    const isAmountValid = sourceAmount && parseFloat(sourceAmount)
    const WZETA = balances.find((b: any) => b.id === "7001__wzeta")
    const dIsZETA = d.coin_type === "Gas" && d.chain_id === 7001
    const sIsZETA = s.coin_type === "Gas" && d.chain_id === 7001
    let sourceAddress
    if (s.coin_type === "ZRC20") {
      sourceAddress = s.contract
    } else if (sIsZETA) {
      sourceAddress = WZETA.contract
    } else {
      sourceAddress = s.zrc20
    }
    if (!isAmountValid) return "0"
    if (isAmountValid > 0 && (dIsZRC20 || dIsZETA) && sourceAddress) {
      let amount
      if (withdraw && crossChainFee) {
        const AmountMinusFee = utils
          .parseUnits(sourceAmount, sourceTokenSelected.decimals)
          .sub(utils.parseUnits(crossChainFee.amount, crossChainFee.decimals))

        amount = utils.formatUnits(AmountMinusFee, sourceTokenSelected.decimals)
      } else {
        amount = sourceAmount
      }
      const target = d.coin_type === "ZRC20" ? d.contract : d.zrc20
      const dAddress = dIsZETA ? WZETA.contract : target
      let q
      try {
        q = await client.getQuote(amount, sourceAddress, dAddress)
      } catch (error) {
        console.error("Error fetching quote:", error)
        return "0"
      }
      return utils.formatUnits(q.amount, q.decimals)
    }
  }

  useEffect(() => {
    if (sourceTokenSelected && destinationTokenSelected) {
      updateError("sendTypeUnsupported", { enabled: !sendType })
    }
    updateError("sourceTokenNotSelected", { enabled: !sourceTokenSelected })
    updateError("destinationTokenNotSelected", {
      enabled: !destinationTokenSelected,
    })
    if (sourceAmount === false) {
      // if the amount hasn't been set yet (i.e. the user hasn't typed anything)
      updateError("enterAmount", { enabled: true })
    } else {
      updateError("enterAmount", { enabled: false })
      if (!destinationAmountIsLoading) {
        updateError("amountLTFee", { enabled: !isAmountGTFee })
        updateError("amountGTBalance", { enabled: !isAmountLTBalance })
      }
    }
  }, [
    sendType,
    sourceTokenSelected,
    destinationTokenSelected,
    isAmountGTFee,
    isAmountLTBalance,
    sourceAmount,
  ])

  // Set whether amount is valid
  useEffect(() => {
    const am = parseFloat(sourceAmount || "0")
    const ltBalance = am >= 0 && am <= parseFloat(sourceTokenSelected?.balance)
    if (["crossChainZeta"].includes(sendType as any)) {
      const gtFee = am > parseFloat(crossChainFee?.amount)
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else if (
      ["crossChainSwap", "crossChainSwapBTC"].includes(sendType as any)
    ) {
      const gtFee = parseFloat(sourceAmount) > parseFloat(crossChainFee?.amount)
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else {
      setIsAmountGTFee(true)
      setIsAmountLTBalance(ltBalance)
    }
  }, [sourceAmount, crossChainFee, sendType, destinationAmount])

  // Set destination address
  useEffect(() => {
    if (!isAddressSelectedValid && destinationTokenSelected) {
      if (destinationTokenSelected.chain_name === "btc_testnet") {
        setAddressSelected(bitcoinAddress)
      } else {
        setAddressSelected(address)
      }
    }
  }, [destinationTokenSelected, isAddressSelectedValid])

  useEffect(() => {
    setAddressSelected(customAddressSelected || address)
  }, [customAddressSelected, address])

  const saveCustomAddress = () => {
    if (isCustomAddressValid) {
      setCustomAddressSelected(customAddress)
      setCustomAddress(customAddress)
      setCustomAddressOpen(false)
    }
  }

  // Set whether the custom destination address is valid
  useEffect(() => {
    let isValidBech32 = false
    try {
      if (bech32.decode(customAddress)) {
        const bech32address = utils.solidityPack(
          ["bytes"],
          [utils.toUtf8Bytes(customAddress)]
        )
        if (bech32address) {
          isValidBech32 = true
        }
      }
    } catch (e) {}
    const isValidEVMAddress = ethers.utils.isAddress(customAddress)
    if (!destinationTokenSelected) {
      setIsCustomAddressValid(true)
    } else if (destinationTokenSelected?.chain_name === "btc_testnet") {
      setIsCustomAddressValid(isValidBech32)
    } else {
      setIsCustomAddressValid(isValidEVMAddress)
    }
  }, [customAddress, destinationTokenSelected])

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
      setSendButtonText((priorityErrors as any)[0].message)
    } else {
      setSendButtonText("Send Tokens")
    }
  }, [destinationAmountIsLoading, sendDisabled, priorityErrors])

  // Set whether the selected destination address is valid
  useEffect(() => {
    let isValidBech32 = false
    try {
      if (bech32.decode(addressSelected)) {
        const bech32address = utils.solidityPack(
          ["bytes"],
          [utils.toUtf8Bytes(addressSelected)]
        )
        if (bech32address) {
          isValidBech32 = true
        }
      }
    } catch (e) {}
    const isValidEVMAddress = ethers.utils.isAddress(addressSelected)
    if (!destinationTokenSelected) {
      setIsAddressSelectedValid(true)
    } else if (destinationTokenSelected?.chain_name === "btc_testnet") {
      setIsAddressSelectedValid(isValidBech32)
    } else {
      setIsAddressSelectedValid(isValidEVMAddress)
    }
  }, [addressSelected, destinationTokenSelected])

  // Set whether the chain currently selected is the right one
  useEffect(() => {
    if (sourceTokenSelected?.chain_name === "btc_testnet") {
      setIsRightChain(true)
    } else if (chain && sourceTokenSelected) {
      setIsRightChain(
        chain.id.toString() === sourceTokenSelected.chain_id.toString()
      )
    }
  }, [chain, sourceTokenSelected])

  const sendTypeDetails: any = {
    crossChainZeta: { title: "Transfer" },
    wrapZeta: { title: "Wrap" },
    unwrapZeta: { title: "Unwrap" },
    depositNative: { title: "Deposit" },
    depositERC20: { title: "Deposit" },
    withdrawZRC20: { title: "Withdraw" },
    transferNativeEVM: { title: "Send" },
    transferERC20EVM: { title: "Send" },
    crossChainSwap: { title: "Swap" },
    crossChainSwapBTC: { title: "Swap" },
    crossChainSwapBTCTransfer: { title: "Deposit and Swap" },
    crossChainSwapTransfer: { title: "Deposit and Swap" },
    transferBTC: { title: "Send" },
    depositBTC: { title: "Deposit" },
    withdrawBTC: { title: "Withdraw" },
    fromZetaChainSwapAndWithdraw: { title: "Swap and Withdraw" },
  }

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
