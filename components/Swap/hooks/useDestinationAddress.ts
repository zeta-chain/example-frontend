import { useEffect, useState } from "react"
import { bech32 } from "bech32"
import { ethers, utils } from "ethers"

import type { Token } from "./types"

const useDestinationAddress = (
  address: `0x${string}` | undefined,
  destinationTokenSelected: Token | null,
  bitcoinAddress: string | null
) => {
  const [addressSelected, setAddressSelected] = useState<string>("")
  const [isAddressSelectedValid, setIsAddressSelectedValid] = useState(false)
  const [customAddress, setCustomAddress] = useState<string>("")
  const [customAddressSelected, setCustomAddressSelected] = useState<
    string | null
  >(null)
  const [isCustomAddressValid, setIsCustomAddressValid] = useState(false)

  useEffect(() => {
    if (!isAddressSelectedValid && destinationTokenSelected) {
      if (destinationTokenSelected.chain_name === "btc_testnet") {
        setAddressSelected(bitcoinAddress || "")
      } else {
        setAddressSelected(address || "")
      }
    }
  }, [
    destinationTokenSelected,
    isAddressSelectedValid,
    bitcoinAddress,
    address,
  ])

  useEffect(() => {
    setAddressSelected(customAddressSelected || address || "")
  }, [customAddressSelected, address])

  useEffect(() => {
    let isValidBech32 = false
    try {
      if (customAddress && bech32.decode(customAddress)) {
        const bech32address = utils.solidityPack(
          ["bytes"],
          [utils.toUtf8Bytes(customAddress)]
        )
        if (bech32address) {
          isValidBech32 = true
        }
      }
    } catch (e) {}
    const isValidEVMAddress = ethers.utils.isAddress(customAddress)
    if (!destinationTokenSelected) {
      setIsCustomAddressValid(true)
    } else if (destinationTokenSelected.chain_name === "btc_testnet") {
      setIsCustomAddressValid(isValidBech32)
    } else {
      setIsCustomAddressValid(isValidEVMAddress)
    }
  }, [customAddress, destinationTokenSelected])

  const saveCustomAddress = () => {
    if (isCustomAddressValid) {
      setCustomAddressSelected(customAddress)
      setCustomAddress(customAddress)
    }
  }

  useEffect(() => {
    let isValidBech32 = false
    try {
      if (addressSelected && bech32.decode(addressSelected)) {
        const bech32address = utils.solidityPack(
          ["bytes"],
          [utils.toUtf8Bytes(addressSelected)]
        )
        if (bech32address) {
          isValidBech32 = true
        }
      }
    } catch (e) {}
    const isValidEVMAddress = ethers.utils.isAddress(addressSelected || "")
    if (!destinationTokenSelected) {
      setIsAddressSelectedValid(true)
    } else if (destinationTokenSelected.chain_name === "btc_testnet") {
      setIsAddressSelectedValid(isValidBech32)
    } else {
      setIsAddressSelectedValid(isValidEVMAddress)
    }
  }, [addressSelected, destinationTokenSelected])

  return {
    addressSelected,
    isAddressSelectedValid,
    canChangeAddress: true,
    customAddress,
    setCustomAddress,
    isCustomAddressValid,
    saveCustomAddress,
  }
}

export default useDestinationAddress
