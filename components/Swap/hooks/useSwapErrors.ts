import { useEffect, useState } from "react"

import type { Error, Errors, Token } from "./types"

const useSwapErrors = (
  sourceTokenSelected: Token | null,
  destinationTokenSelected: Token | null,
  sendType: string | null,
  sourceAmount: string,
  isAmountGTFee: boolean,
  isAmountLTBalance: boolean,
  destinationAmountIsLoading: boolean
) => {
  const [errors, setErrors] = useState<Errors>({
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

  const updateError = (errorKey: keyof Errors, update: Partial<Error>) => {
    setErrors((prevErrors) => ({
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
    if (sourceAmount === null) {
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
    destinationAmountIsLoading,
  ])

  const priorityErrors = Object.values(errors)
    .filter((error) => error.enabled)
    .sort((a, b) => b.priority - a.priority)

  return { updateError, priorityErrors }
}

export default useSwapErrors
