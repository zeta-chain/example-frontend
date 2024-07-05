import { useEffect, useState } from "react"

import { CrossChainFee, TokenSelected } from "./types"

const useAmountValidation = (
  sourceTokenSelected: TokenSelected | null,
  sourceAmount: string | null,
  crossChainFee: CrossChainFee | null,
  sendType: string
) => {
  const [isAmountGTFee, setIsAmountGTFee] = useState(false)
  const [isAmountLTBalance, setIsAmountLTBalance] = useState(false)

  useEffect(() => {
    const am = parseFloat(sourceAmount || "0")
    const ltBalance =
      am >= 0 && am <= parseFloat(sourceTokenSelected?.balance || "0")
    if (["crossChainZeta"].includes(sendType)) {
      const gtFee = am > parseFloat(crossChainFee?.amount.toString() || "0")
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else if (["crossChainSwap", "crossChainSwapBTC"].includes(sendType)) {
      const gtFee =
        parseFloat(sourceAmount || "0") >
        parseFloat(crossChainFee?.amount.toString() || "0")
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
