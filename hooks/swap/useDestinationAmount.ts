import { useEffect, useState } from "react"
import { useBalanceContext } from "@/context/BalanceContext"
import { utils } from "ethers"
import debounce from "lodash/debounce"

import { roundNumber } from "@/lib/utils"
import { useZetaChainClient } from "@/hooks/useZetaChainClient"

const useDestinationAmount = (
  sourceTokenSelected: any,
  destinationTokenSelected: any,
  sourceAmount: any,
  crossChainFee: any,
  sendType: any
) => {
  const { client } = useZetaChainClient()
  const [destinationAmount, setDestinationAmount] = useState("")
  const [destinationAmountIsLoading, setDestinationAmountIsLoading] =
    useState(false)
  const { balances, bitcoinAddress } = useBalanceContext()

  useEffect(() => {
    setDestinationAmount("")
    const fetchQuoteCrossChain = async (
      s: any,
      d: any,
      sourceAmount: any,
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
        sourceTokenSelected,
        destinationTokenSelected,
        sourceAmount,
        true
      )
    } else if (
      ["crossChainSwapBTCTransfer", "crossChainSwapTransfer"].includes(sendType)
    ) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected,
        destinationTokenSelected,
        sourceAmount,
        false
      )
    } else if (["crossChainZeta"].includes(sendType)) {
      const delta = parseFloat(sourceAmount) - crossChainFee?.amount
      if (sourceAmount && delta > 0) {
        setDestinationAmount(delta.toFixed(2).toString())
      }
    } else if (["fromZetaChainSwap"].includes(sendType)) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected,
        destinationTokenSelected,
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
  ])

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

  return {
    destinationAmount,
    destinationAmountIsLoading,
  }
}

export default useDestinationAmount
