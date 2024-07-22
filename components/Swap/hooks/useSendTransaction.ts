import { useState } from "react"
import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { ParamChainName, getAddress } from "@zetachain/protocol-contracts"
import ERC20Custody from "@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json"
import WETH9 from "@zetachain/protocol-contracts/abi/zevm/WZETA.sol/WETH9.json"
import { bech32 } from "bech32"
import { ethers } from "ethers"
import { parseEther, parseUnits } from "viem"
import { useAccount } from "wagmi"

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
  bitcoinAddress: string,
  client: any,
  track?: any
) => {
  const { address } = useAccount()
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
        if (!error && track) {
          track({
            hash: hash,
            desc: `Sent ${sourceAmount} tBTC`,
          })
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
        if (!error && track) {
          track({
            hash: hash,
            desc: `Sent ${a} tBTC`,
          })
        }
      }
    )
  }

  m.transferNativeEVM = async () => {
    await client.signer?.sendTransaction({
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
    if (track) {
      track({
        hash: tx.hash,
        desc: `Sent ${sourceAmount} ZETA from ${from} to ${to}`,
      })
    }
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
    if (track) {
      track({
        hash: tx.hash,
        desc: `Sent ${sourceAmount} ${token} from ${from} to ${to}`,
      })
    }
  }

  m.wrapZeta = async () => {
    const zetaTokenAddress = getAddress("zetaToken", "zeta_testnet")
    if (!zetaTokenAddress) {
      throw new Error("ZetaToken address not found.")
    }
    client.signer?.sendTransaction({
      to: zetaTokenAddress,
      value: parseEther(sourceAmount),
    })
  }

  m.unwrapZeta = async () => {
    const zetaTokenAddress = getAddress("zetaToken", "zeta_testnet")
    if (!zetaTokenAddress) {
      throw new Error("ZetaToken address not found.")
    }
    if (client.signer) {
      const contract = new ethers.Contract(
        zetaTokenAddress,
        WETH9.abi,
        client.signer
      )
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
      client.signer
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
    if (track) {
      track({
        hash: tx.hash,
        desc: `Sent ${sourceAmount} ${token} from ${from} to ${dest}`,
      })
    }
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
    if (track) {
      track({
        hash: tx.hash,
        desc: `Sent ${sourceAmount} ${token} from ${from} to ${to}`,
      })
    }
  }

  m.fromZetaChainSwapAndWithdraw = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const swapContract = new ethers.Contract(
      omnichainSwapContractAddress,
      SwapToAnyToken.abi,
      client.signer
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
      client.signer
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
    if (track) {
      track({
        hash: tx.hash,
        desc: `Sent ${sourceAmount} ${sourceTokenSelected.symbol} from ZetaChain to ${destinationTokenSelected.chain_name}`,
      })
    }
  }

  m.fromZetaChainSwap = async () => {
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }
    const swapContract = new ethers.Contract(
      omnichainSwapContractAddress,
      SwapToAnyToken.abi,
      client.signer
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
      client.signer
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
      client.signer
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
        client.signer
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
      if (track) {
        track({
          hash: tx.hash,
          desc: `Sent ${sourceAmount} ${token} from ${from} to ${dest}`,
        })
      }
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
    if (!sourceTokenSelected || !destinationTokenSelected) {
      return
    }

    const tiker = sourceTokenSelected.ticker
    const from = sourceTokenSelected.chain_name
    const dest = destinationTokenSelected.chain_name

    let recipient
    try {
      if (bech32.decode(addressSelected)) {
        recipient = ethers.utils.solidityPack(
          ["bytes"],
          [ethers.utils.toUtf8Bytes(addressSelected)]
        )
      }
    } catch (e) {
      recipient = addressSelected
    }
    const d = destinationTokenSelected
    const zrc20 = d.coin_type === "ZRC20" ? d.contract : d.zrc20
    const params = {
      chain: from,
      amount: sourceAmount,
      recipient: omnichainSwapContractAddress,
      message: [
        ["address", "bytes", "bool"],
        [zrc20, recipient, withdraw],
      ],
      erc20: sourceTokenSelected.contract,
    }
    const tx = await client.deposit(params)

    if (tx && track) {
      track({
        hash: tx.hash,
        desc: `Sent ${sourceAmount} ${tiker} from ${from} to ${dest}`,
      })
    }
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
