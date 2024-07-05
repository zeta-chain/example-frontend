import { useEffect, useState } from "react"

import type { CrossChainFee, Token } from "./types"

const useAmountValidation = (
  sourceTokenSelected: Token | null,
  sourceAmount: string,
  crossChainFee: CrossChainFee | null,
  sendType: string | null
) => {
  const [isAmountGTFee, setIsAmountGTFee] = useState(false)
  const [isAmountLTBalance, setIsAmountLTBalance] = useState(false)

  useEffect(() => {
    const am = parseFloat(sourceAmount || "0")
    const ltBalance =
      am >= 0 && am <= parseFloat(sourceTokenSelected?.balance || "0")

    const type = sendType || ""

    if (["crossChainZeta"].includes(type)) {
      const gtFee = am > parseFloat(crossChainFee?.amount.toString() || "0")
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else if (["crossChainSwap", "crossChainSwapBTC"].includes(type)) {
      const gtFee = am > parseFloat(crossChainFee?.amount.toString() || "0")
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else {
      setIsAmountGTFee(true)
      setIsAmountLTBalance(ltBalance)
    }
  }, [sourceAmount, crossChainFee, sendType, sourceTokenSelected])

  return { isAmountGTFee, isAmountLTBalance }
}

export default useAmountValidation
