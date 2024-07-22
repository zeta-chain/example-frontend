import { useEffect, useState } from "react"
import { utils } from "ethers"
import debounce from "lodash/debounce"

import { roundNumber } from "../lib/utils"
import type { Balance, CrossChainFee, Token } from "./types"

const useDestinationAmount = (
  sourceTokenSelected: Token | null,
  destinationTokenSelected: Token | null,
  sourceAmount: string,
  crossChainFee: CrossChainFee | null,
  sendType: string | null,
  balances: any,
  client: any
) => {
  const [destinationAmount, setDestinationAmount] = useState<string>("")
  const [destinationAmountIsLoading, setDestinationAmountIsLoading] =
    useState<boolean>(false)

  useEffect(() => {
    setDestinationAmount("")
    const fetchQuoteCrossChain = async (
      s: Token,
      d: Token,
      sourceAmount: string,
      withdraw: boolean
    ) => {
      setDestinationAmount("")
      setDestinationAmountIsLoading(true)
      try {
        const quote = await getQuoteCrossChain(s, d, sourceAmount, withdraw)
        if (quote) {
          setDestinationAmount(roundNumber(parseFloat(quote)).toString())
          setDestinationAmountIsLoading(false)
        }
      } catch (e) {
        console.error(e)
        setDestinationAmountIsLoading(false)
      }
    }
    const debouncedFetchQuoteCrossChain = debounce(fetchQuoteCrossChain, 500)
    if (!sendType) {
      setDestinationAmountIsLoading(false)
      return
    }
    if (
      [
        "crossChainSwap",
        "crossChainSwapBTC",
        "fromZetaChainSwapAndWithdraw",
      ].includes(sendType)
    ) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected!,
        destinationTokenSelected!,
        sourceAmount,
        true
      )
    } else if (
      ["crossChainSwapBTCTransfer", "crossChainSwapTransfer"].includes(sendType)
    ) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected!,
        destinationTokenSelected!,
        sourceAmount,
        false
      )
    } else if (["crossChainZeta"].includes(sendType)) {
      const delta =
        parseFloat(sourceAmount) - parseFloat(crossChainFee?.amount || "0")
      if (sourceAmount && delta > 0) {
        setDestinationAmount(delta.toFixed(2).toString())
      }
    } else if (["fromZetaChainSwap"].includes(sendType)) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected!,
        destinationTokenSelected!,
        sourceAmount,
        false
      )
    } else {
      setDestinationAmount(sourceAmount)
    }
    return () => {
      debouncedFetchQuoteCrossChain.cancel()
    }
  }, [
    sourceTokenSelected,
    destinationTokenSelected,
    sourceAmount,
    crossChainFee,
    sendType,
  ])

  const getQuoteCrossChain = async (
    s: Token,
    d: Token,
    sourceAmount: string,
    withdraw: boolean
  ) => {
    const dIsZRC20 = d?.zrc20 || (d?.coin_type === "ZRC20" && d?.contract)
    const isAmountValid = sourceAmount && parseFloat(sourceAmount) > 0
    const WZETA = balances.find((b: Balance) => b.id === "7001__wzeta")
    const dIsZETA = d.coin_type === "Gas" && Number(d.chain_id) === 7001 // Convert chain_id to number
    const sIsZETA = s.coin_type === "Gas" && s.chain_id === 7001
    let sourceAddress
    if (s.coin_type === "ZRC20") {
      sourceAddress = s.contract
    } else if (sIsZETA) {
      sourceAddress = WZETA?.contract
    } else {
      sourceAddress = s.zrc20
    }
    if (!isAmountValid) return "0"
    if (isAmountValid && (dIsZRC20 || dIsZETA) && sourceAddress) {
      let amount
      if (withdraw && crossChainFee) {
        const AmountMinusFee = utils
          .parseUnits(sourceAmount, sourceTokenSelected!.decimals)
          .sub(utils.parseUnits(crossChainFee.amount, crossChainFee.decimals))

        amount = utils.formatUnits(
          AmountMinusFee,
          sourceTokenSelected!.decimals
        )
      } else {
        amount = sourceAmount
      }
      const target = d.coin_type === "ZRC20" ? d.contract : d.zrc20
      const dAddress = dIsZETA ? WZETA?.contract : target
      let q
      try {
        q = await client.getQuote(amount, sourceAddress, dAddress!)
      } catch (error) {
        console.error("Error fetching quote:", error)
        return "0"
      }
      return utils.formatUnits(q.amount, q.decimals)
    }
  }

  return {
    destinationAmount,
    destinationAmountIsLoading,
  }
}

export default useDestinationAmount
