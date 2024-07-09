export const roundNumber = (value: number): number => {
  const roundToSignificantDigits = (
    value: number,
    significantDigits: number
  ): number => {
    if (value === 0) return 0
    const digits =
      -Math.floor(Math.log10(Math.abs(value))) + (significantDigits - 1)
    const factor = 10 ** digits
    return Math.round(value * factor) / factor
  }

  if (value >= 1) {
    return parseFloat(value.toFixed(1))
  }
  return roundToSignificantDigits(value, 2)
}

export const formatAddress = (address: any) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}
