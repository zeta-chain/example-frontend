import { useEffect, useState } from "react"
import { bech32 } from "bech32"
import { ethers, utils } from "ethers"

const useDestinationAddress = (
  address: any,
  destinationTokenSelected: any,
  bitcoinAddress: string | null
) => {
  const [addressSelected, setAddressSelected] = useState<string | null>(null)
  const [isAddressSelectedValid, setIsAddressSelectedValid] = useState(false)
  const [customAddress, setCustomAddress] = useState("")
  const [customAddressSelected, setCustomAddressSelected] = useState<
    string | null
  >("")
  const [customAddressOpen, setCustomAddressOpen] = useState(false)
  const [isCustomAddressValid, setIsCustomAddressValid] = useState(false)

  useEffect(() => {
    if (!isAddressSelectedValid && destinationTokenSelected) {
      if (destinationTokenSelected.chain_name === "btc_testnet") {
        setAddressSelected(bitcoinAddress)
      } else {
        setAddressSelected(address)
      }
    }
  }, [
    destinationTokenSelected,
    isAddressSelectedValid,
    bitcoinAddress,
    address,
  ])

  useEffect(() => {
    setAddressSelected(customAddressSelected || address)
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
    } else if (destinationTokenSelected?.chain_name === "btc_testnet") {
      setIsCustomAddressValid(isValidBech32)
    } else {
      setIsCustomAddressValid(isValidEVMAddress)
    }
  }, [customAddress, destinationTokenSelected])

  const saveCustomAddress = () => {
    if (isCustomAddressValid) {
      setCustomAddressSelected(customAddress)
      setCustomAddress(customAddress)
      setCustomAddressOpen(false)
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
    } else if (destinationTokenSelected?.chain_name === "btc_testnet") {
      setIsAddressSelectedValid(isValidBech32)
    } else {
      setIsAddressSelectedValid(isValidEVMAddress)
    }
  }, [addressSelected, destinationTokenSelected])

  return {
    addressSelected,
    isAddressSelectedValid,
    customAddressOpen,
    setCustomAddressOpen,
    canChangeAddress: true,
    customAddress,
    setCustomAddress,
    isCustomAddressValid,
    saveCustomAddress,
  }
}

export default useDestinationAddress
