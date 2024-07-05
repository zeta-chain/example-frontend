import { useEffect, useState } from "react"

const useSwapErrors = (
  sourceTokenSelected: any,
  destinationTokenSelected: any,
  sendType: any,
  sourceAmount: any,
  isAmountGTFee: any,
  isAmountLTBalance: any,
  destinationAmountIsLoading: any
) => {
  const [errors, setErrors] = useState({
    sendTypeUnsupported: {
      message: "Transfer type not supported",
      enabled: false,
      priority: 5,
    },
    sourceTokenNotSelected: {
      message: "Select source token",
      enabled: true,
      priority: 4,
    },
    destinationTokenNotSelected: {
      message: "Select destination token",
      enabled: true,
      priority: 3,
    },
    enterAmount: {
      message: "Enter an amount",
      enabled: false,
      priority: 2,
    },
    amountLTFee: {
      message: "Amount must be higher than fee",
      enabled: false,
      priority: 1,
    },
    amountGTBalance: {
      message: "Insufficient balance",
      enabled: false,
      priority: 0,
    },
    insufficientLiquidity: {
      message: "Insufficient liquidity",
      enabled: false,
      priority: 0,
    },
  })

  const updateError = (errorKey: any, update: any) => {
    setErrors((prevErrors: any) => ({
      ...prevErrors,
      [errorKey]: {
        ...prevErrors[errorKey],
        ...update,
      },
    }))
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

  const priorityErrors = Object.entries(errors)
    .filter(([key, value]) => value.enabled)
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([key, value]) => value)

  return { errors, updateError, priorityErrors }
}

export default useSwapErrors
