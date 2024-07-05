import { useState } from "react"
import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { ParamChainName, getAddress } from "@zetachain/protocol-contracts"
import ERC20Custody from "@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json"
import WETH9 from "@zetachain/protocol-contracts/abi/zevm/WZETA.sol/WETH9.json"
import { ethers } from "ethers"
import { parseEther, parseUnits } from "viem"
import { useAccount } from "wagmi"

import { useEthersSigner } from "@/hooks/useEthersSigner"

import SwapToAnyToken from "./SwapToAnyToken.json"
import type { Inbound, Token } from "./types"

const useSendTransaction = (
  sendType: string | null,
  sourceTokenSelected: Token | null,
  destinationTokenSelected: Token | null,
  sourceAmount: string,
  addressSelected: string,
  setSourceAmount: (amount: string) => void,
  omnichainSwapContractAddress: string,
  inbounds: Inbound[],
  setInbounds: (inbounds: Inbound[]) => void,
  bitcoinAddress: string,
  client: any
) => {
  const { address } = useAccount()
  const signer = useEthersSigner()
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!sendType) {
      throw new Error("Send type is not defined.")
    }
    if (!address) {
      throw new Error("Address undefined.")
    }
    if (!sourceTokenSelected || !destinationTokenSelected) {
      throw new Error("Token not selected.")
    }

    setIsSending(true)

    try {
      await m[sendType]()
      setSourceAmount("")
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  const m: Record<string, () => Promise<void>> = {}

  const bitcoinXDEFITransfer = (
    from: string,
    recipient: string,
    amount: number,
    memo: string
  ) => {
    return {
      method: "transfer",
      params: [
        {
          feeRate: 10,
          from,
          recipient,
          amount: {
            amount,
            decimals: 8,
          },
          memo,
        },
      ],
    }
  }

  const crossChainSwapBTCHandle = async ({
    withdraw,
  }: {
    withdraw: boolean
  }) => {
    if (!address) {
      console.error("EVM address undefined.")
      return
    }
    if (!bitcoinAddress) {
      console.error("Bitcoin address undefined.")
      return
    }
    if (!destinationTokenSelected) {
      console.error("Destination token not selected.")
      return
    }
    const a = parseFloat(sourceAmount) * 1e8
    const bitcoinTSSAddress = "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
    const contract = omnichainSwapContractAddress.replace(/^0x/, "")
    const zrc20 = destinationTokenSelected.zrc20?.replace(/^0x/, "")
    const dest = address.replace(/^0x/, "")
    const withdrawFlag = withdraw ? "00" : "01"
    const memo = `hex::${contract}${zrc20}${dest}${withdrawFlag}`
    window.xfi.bitcoin.request(
      bitcoinXDEFITransfer(bitcoinAddress, bitcoinTSSAddress, a, memo),
      (error: any, hash: any) => {
        if (!error) {
          const inbound = {
            inboundHash: hash,
            desc: `Sent ${sourceAmount} tBTC`,
          }
          setInbounds([...inbounds, inbound])
        }
      }
    )
  }

  m.crossChainSwapBTC = async () => crossChainSwapBTCHandle({ withdraw: true })
  m.crossChainSwapBTCTransfer = async () =>
    crossChainSwapBTCHandle({ withdraw: false })

  m.depositBTC = async () => {
    if (!address) {
      console.error("EVM address undefined.")
      return
    }
    if (!bitcoinAddress) {
      console.error("Bitcoin address undefined.")
      return
    }
    const a = parseFloat(sourceAmount) * 1e8
    const bitcoinTSSAddress = "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
    const memo = `hex::${address.replace(/^0x/, "")}`
    window.xfi.bitcoin.request(
      bitcoinXDEFITransfer(bitcoinAddress, bitcoinTSSAddress, a, memo),
      (error: any, hash: any) => {
        if (!error) {
          const inbound = {
            inboundHash: hash,
            desc: `Sent ${a} tBTC`,
          }
          setInbounds([...inbounds, inbound])
        }
      }
    )
  }

  m.transferNativeEVM = async () => {
    await signer?.sendTransaction({
      to: addressSelected,
      value: parseEther(sourceAmount),
    })
  }

  m.crossChainZeta = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const from = sourceTokenSelected.chain_name
    const to = destinationTokenSelected.chain_name
    const tx = await client.sendZeta({
      chain: from,
      destination: to,
      recipient: address as string,
      amount: sourceAmount,
    })
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${sourceAmount} ZETA from ${from} to ${to}`,
    }
    setInbounds([...inbounds, inbound])
  }

  m.withdrawBTC = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const from = sourceTokenSelected.chain_name
    const to = destinationTokenSelected.chain_name
    const btc = bitcoinAddress
    const token = sourceTokenSelected.symbol
    const tx = await client.deposit({
      chain: from,
      amount: sourceAmount,
      recipient: addressSelected,
    })
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${sourceAmount} ${token} from ${from} to ${to}`,
    }
    setInbounds([...inbounds, inbound])
  }

  m.wrapZeta = async () => {
    const zetaTokenAddress = getAddress("zetaToken", "zeta_testnet")
    if (!zetaTokenAddress) {
      throw new Error("ZetaToken address not found.")
    }
    signer?.sendTransaction({
      to: zetaTokenAddress,
      value: parseEther(sourceAmount),
    })
  }

  m.unwrapZeta = async () => {
    const zetaTokenAddress = getAddress("zetaToken", "zeta_testnet")
    if (!zetaTokenAddress) {
      throw new Error("ZetaToken address not found.")
    }
    if (signer) {
      const contract = new ethers.Contract(zetaTokenAddress, WETH9.abi, signer)
      contract.withdraw(parseEther(sourceAmount))
    }
  }

  m.transferERC20EVM = async () => {
    if (!sourceTokenSelected) {
      return
    }
    const contract = new ethers.Contract(
      sourceTokenSelected.contract as string,
      ERC20_ABI.abi,
      signer
    )
    const approve = await contract.approve(
      addressSelected,
      parseUnits(sourceAmount, sourceTokenSelected.decimals)
    )
    await approve.wait()
    await contract.transfer(
      addressSelected,
      parseUnits(sourceAmount, sourceTokenSelected.decimals)
    )
  }

  m.withdrawZRC20 = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const destination = destinationTokenSelected.chain_name
    const zrc20 = getAddress("zrc20", destination as ParamChainName)
    if (!zrc20) {
      console.error("ZRC-20 address not found")
      return
    }
    const tx = await client.withdraw({
      amount: sourceAmount,
      zrc20,
      recipient: addressSelected,
    })
    const token = sourceTokenSelected.symbol
    const from = sourceTokenSelected.chain_name
    const dest = destinationTokenSelected.chain_name
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${sourceAmount} ${token} from ${from} to ${dest}`,
    }
    setInbounds([...inbounds, inbound])
  }

  m.depositNative = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const from = sourceTokenSelected.chain_name
    const to = destinationTokenSelected.chain_name
    const token = sourceTokenSelected.symbol
    const tx = await client.deposit({
      chain: from,
      amount: sourceAmount,
      recipient: addressSelected,
    })
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${sourceAmount} ${token} from ${from} to ${to}`,
    }
    setInbounds([...inbounds, inbound])
  }

  m.fromZetaChainSwapAndWithdraw = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const swapContract = new ethers.Contract(
      omnichainSwapContractAddress,
      SwapToAnyToken.abi,
      signer
    )
    const amount = ethers.utils.parseUnits(
      sourceAmount,
      sourceTokenSelected.decimals
    )
    const sourceToken = sourceTokenSelected.contract
    const destinationToken = destinationTokenSelected.zrc20
    const erc20Contract = new ethers.Contract(
      sourceToken as string,
      ERC20_ABI.abi,
      signer
    )
    const approve = await erc20Contract.approve(
      omnichainSwapContractAddress,
      amount
    )
    const recipient = ethers.utils.arrayify(addressSelected)
    await approve.wait()
    const tx = await swapContract.swap(
      sourceToken,
      amount,
      destinationToken,
      recipient,
      true
    )
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${sourceAmount} ${sourceTokenSelected.symbol} from ZetaChain to ${destinationTokenSelected.chain_name}`,
    }
    setInbounds([...inbounds, inbound])
  }

  m.fromZetaChainSwap = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const swapContract = new ethers.Contract(
      omnichainSwapContractAddress,
      SwapToAnyToken.abi,
      signer
    )
    const amount = ethers.utils.parseUnits(
      sourceAmount,
      sourceTokenSelected.decimals
    )
    const sourceToken = sourceTokenSelected.contract
    const destinationToken = destinationTokenSelected.contract
    const erc20Contract = new ethers.Contract(
      sourceToken as string,
      ERC20_ABI.abi,
      signer
    )
    const approve = await erc20Contract.approve(
      omnichainSwapContractAddress,
      amount
    )
    const recipient = ethers.utils.arrayify(addressSelected)
    await approve.wait()
    await swapContract.swap(
      sourceToken,
      amount,
      destinationToken,
      recipient,
      false
    )
  }

  m.depositERC20 = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const custodyAddress = getAddress(
      "erc20Custody",
      sourceTokenSelected.chain_name as ParamChainName
    )
    const custodyContract = new ethers.Contract(
      custodyAddress as string,
      ERC20Custody.abi,
      signer
    )
    const assetAddress = sourceTokenSelected.contract
    const amount = ethers.utils.parseUnits(
      sourceAmount,
      sourceTokenSelected.decimals
    )
    try {
      const contract = new ethers.Contract(
        assetAddress as string,
        ERC20_ABI.abi,
        signer
      )
      await (await contract.approve(custodyAddress, amount)).wait()
      const tx = await custodyContract.deposit(
        addressSelected,
        assetAddress,
        amount,
        "0x"
      )
      await tx.wait()
      const token = sourceTokenSelected.symbol
      const from = sourceTokenSelected.chain_name
      const dest = destinationTokenSelected.chain_name
      const inbound = {
        inboundHash: tx.hash,
        desc: `Sent ${sourceAmount} ${token} from ${from} to ${dest}`,
      }
      setInbounds([...inbounds, inbound])
    } catch (error) {
      console.error("Error during deposit: ", error)
    }
  }

  m.transferBTC = async () => {
    if (!bitcoinAddress) {
      console.error("Bitcoin address undefined.")
      return
    }
    const a = parseFloat(sourceAmount) * 1e8
    const memo = ""
    window.xfi.bitcoin.request(
      bitcoinXDEFITransfer(bitcoinAddress, addressSelected, a, memo)
    )
  }

  const crossChainSwapHandle = async (withdraw: boolean) => {
    if (!address) {
      console.error("EVM address undefined.")
      return
    }
    if (!bitcoinAddress) {
      console.error("Bitcoin address undefined.")
      return
    }
    if (!destinationTokenSelected) {
      console.error("Destination token not selected.")
      return
    }
    const a = parseFloat(sourceAmount) * 1e8
    const bitcoinTSSAddress = "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
    const contract = omnichainSwapContractAddress.replace(/^0x/, "")
    const zrc20 = destinationTokenSelected.zrc20?.replace(/^0x/, "")
    const dest = address.replace(/^0x/, "")
    const withdrawFlag = withdraw ? "00" : "01"
    const memo = `hex::${contract}${zrc20}${dest}${withdrawFlag}`
    window.xfi.bitcoin.request(
      bitcoinXDEFITransfer(bitcoinAddress, bitcoinTSSAddress, a, memo),
      (error: any, hash: any) => {
        if (!error) {
          const inbound = {
            inboundHash: hash,
            desc: `Sent ${sourceAmount} tBTC`,
          }
          setInbounds([...inbounds, inbound])
        }
      }
    )
  }

  m.crossChainSwapBTC = async () => crossChainSwapHandle(true)
  m.crossChainSwapBTCTransfer = async () => crossChainSwapHandle(false)

  m.crossChainSwap = async () => crossChainSwapHandle(true)
  m.crossChainSwapTransfer = async () => crossChainSwapHandle(false)

  return {
    handleSend,
    isSending,
  }
}

export default useSendTransaction
