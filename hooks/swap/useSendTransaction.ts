import { useState } from "react"
import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { getAddress } from "@zetachain/protocol-contracts"
import ERC20Custody from "@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json"
import WETH9 from "@zetachain/protocol-contracts/abi/zevm/WZETA.sol/WETH9.json"
import { prepareData } from "@zetachain/toolkit/client"
import { bech32 } from "bech32"
import { ethers, utils } from "ethers"
import { parseEther, parseUnits } from "viem"
import { useAccount } from "wagmi"

import { useEthersSigner } from "@/hooks/useEthersSigner"

import SwapToAnyToken from "./SwapToAnyToken.json"

const useSendTransaction = (
  sendType: any,
  sourceTokenSelected: any,
  destinationTokenSelected: any,
  sourceAmount: any,
  addressSelected: any,
  setSourceAmount: any,
  omnichainSwapContractAddress: any,
  inbounds: any,
  setInbounds: any,
  bitcoinAddress: any,
  client: any
) => {
  const { address } = useAccount()
  const signer = useEthersSigner()
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    setIsSending(true)

    if (!address) {
      setIsSending(false)
      throw new Error("Address undefined.")
    }

    try {
      await m[sendType]()
      setSourceAmount("")
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  const m = {} as any

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

  m.crossChainSwapBTCHandle = ({ withdraw }: { withdraw: boolean }) => {
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
    const contract = omnichainSwapContractAddress.replace(/^0x/, "")
    const zrc20 = destinationTokenSelected.zrc20.replace(/^0x/, "")
    const dest = address.replace(/^0x/, "")
    // TODO: test with Bitcoin to see if this actually works
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

  m.depositBTC = () => {
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
    signer?.sendTransaction({
      to: getAddress("zetaToken", "zeta_testnet"),
      value: parseEther(sourceAmount),
    })
  }

  m.unwrapZeta = async () => {
    if (signer) {
      const contract = new ethers.Contract(
        getAddress("zetaToken", "zeta_testnet") as any,
        WETH9.abi,
        signer
      )
      contract.withdraw(parseEther(sourceAmount))
    }
  }

  m.transferERC20EVM = async () => {
    const contract = new ethers.Contract(
      sourceTokenSelected.contract,
      ERC20_ABI.abi,
      signer
    )
    const approve = await contract.approve(
      addressSelected,
      parseUnits(sourceAmount, sourceTokenSelected.decimals)
    )
    approve.wait()
    const tx = await contract.transfer(
      addressSelected,
      parseUnits(sourceAmount, sourceTokenSelected.decimals)
    )
  }

  m.withdrawZRC20 = async () => {
    const destination = destinationTokenSelected.chain_name
    const zrc20 = getAddress("zrc20", destination)
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
      sourceToken,
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
      desc: `Sent ${sourceAmount} ${sourceToken.symbol} from ZetaChain to ${destinationTokenSelected.chain_name}`,
    }
    setInbounds([...inbounds, inbound])
  }

  m.fromZetaChainSwap = async () => {
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
      sourceToken,
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
      false
    )
  }

  m.depositERC20 = async () => {
    const custodyAddress = getAddress(
      "erc20Custody",
      sourceTokenSelected.chain_name
    )
    const custodyContract = new ethers.Contract(
      custodyAddress as any,
      ERC20Custody.abi,
      signer
    )
    const assetAddress = sourceTokenSelected.contract
    const amount = ethers.utils.parseUnits(
      sourceAmount,
      sourceTokenSelected.decimals
    )
    try {
      const contract = new ethers.Contract(assetAddress, ERC20_ABI.abi, signer)
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

  m.transferBTC = () => {
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

  m.crossChainSwapHandle = async ({ withdraw }: { withdraw: boolean }) => {
    const d = destinationTokenSelected
    const zrc20 = d.coin_type === "ZRC20" ? d.contract : d.zrc20
    let recipient
    try {
      if (bech32.decode(addressSelected)) {
        recipient = utils.solidityPack(
          ["bytes"],
          [utils.toUtf8Bytes(addressSelected)]
        )
      }
    } catch (e) {
      recipient = addressSelected
    }

    const data = prepareData(
      omnichainSwapContractAddress,
      ["address", "bytes", "bool"],
      [zrc20, recipient, withdraw]
    )

    const to = getAddress("tss", sourceTokenSelected.chain_name)
    const value = parseEther(sourceAmount)

    const tx = await signer?.sendTransaction({ data, to, value })

    const tiker = sourceTokenSelected.ticker
    const from = sourceTokenSelected.chain_name
    const dest = destinationTokenSelected.chain_name

    if (tx) {
      const inbound = {
        inboundHash: tx.hash,
        desc: `Sent ${sourceAmount} ${tiker} from ${from} to ${dest}`,
      }
      setInbounds([...inbounds, inbound])
    }
  }

  m.crossChainSwap = () => m.crossChainSwapHandle({ withdtaw: true })
  m.crossChainSwapTransfer = () => m.crossChainSwapHandle({ withdraw: false })
  m.crossChainSwapBTC = () => m.crossChainSwapBTCHandle({ withdraw: true })
  m.crossChainSwapBTCTransfer = () =>
    m.crossChainSwapBTCHandle({ withdraw: false })

  return {
    handleSend,
    isSending,
  }
}

export default useSendTransaction
