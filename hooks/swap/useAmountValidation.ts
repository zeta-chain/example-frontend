import { useEffect, useState } from "react"

const useAmountValidation = (
  sourceTokenSelected: any,
  sourceAmount: any,
  crossChainFee: any,
  sendType: any
) => {
  const [isAmountGTFee, setIsAmountGTFee] = useState(false)
  const [isAmountLTBalance, setIsAmountLTBalance] = useState(false)

  useEffect(() => {
    const am = parseFloat(sourceAmount || "0")
    const ltBalance = am >= 0 && am <= parseFloat(sourceTokenSelected?.balance)
    if (["crossChainZeta"].includes(sendType)) {
      const gtFee = am > parseFloat(crossChainFee?.amount)
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else if (["crossChainSwap", "crossChainSwapBTC"].includes(sendType)) {
      const gtFee = parseFloat(sourceAmount) > parseFloat(crossChainFee?.amount)
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else {
      setIsAmountGTFee(true)
      setIsAmountLTBalance(ltBalance)
    }
  }, [sourceAmount, crossChainFee, sendType])

  return { isAmountGTFee, isAmountLTBalance }
}

export default useAmountValidation
