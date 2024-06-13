const getRandomEmojiFromSeed = (seed: number): string => {
  // Unicode range for emojis (this range can be expanded)
  const emojiRangeStart = 0x1f600
  const emojiRangeEnd = 0x1f64f
  const randomCodePoint =
    emojiRangeStart + (seed % (emojiRangeEnd - emojiRangeStart + 1))
  return String.fromCodePoint(randomCodePoint)
}

export const ethAddressToSingleEmoji = (address: string): string => {
  // Remove the '0x' prefix if it exists
  if (address.startsWith("0x")) {
    address = address.slice(2)
  }

  // Generate a numeric seed from the address by summing the char codes
  const seed = address
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // Get a single random emoji using the seed
  return getRandomEmojiFromSeed(seed)
}

export const hexToColor = (hex: string): string => {
  // Remove the '0x' prefix if it exists
  if (hex.startsWith("0x")) {
    hex = hex.slice(2)
  }

  // Ensure the hex string is at least 6 characters long by repeating it if necessary
  while (hex.length < 6) {
    hex += hex
  }

  // Take the first 6 characters for the color
  const color = hex.slice(0, 6)

  // Format as a hex color
  return `#${color}`
}

export const getRandomRotation = (): number => {
  const minRotation = -15
  const maxRotation = 15
  return Math.random() * (maxRotation - minRotation) + minRotation
}
