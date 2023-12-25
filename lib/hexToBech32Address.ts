import { bech32 } from "bech32"

export const hexToBech32Address = (
  hexAddress: string,
  prefix: string
): string => {
  const data = Buffer.from(hexAddress.substr(2), "hex")
  const words = bech32.toWords(data)
  return bech32.encode(prefix, words)
}
