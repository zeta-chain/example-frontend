"use client"

import { useContext, useEffect, useState } from "react"
import { useAppContext } from "@/context/AppContext"
import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { getAddress } from "@zetachain/protocol-contracts"
import ERC20Custody from "@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json"
import WETH9 from "@zetachain/protocol-contracts/abi/zevm/WZETA.sol/WETH9.json"
import { ZetaChainClient, prepareData } from "@zetachain/toolkit/client"
import { bech32 } from "bech32"
import { ethers, utils } from "ethers"
import debounce from "lodash/debounce"
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  RefreshCcw,
  Send,
  UserCircle2,
} from "lucide-react"
import { parseEther, parseUnits } from "viem"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { cn } from "@/lib/utils"
import { useEthersSigner } from "@/hooks/useEthersSigner"
import { useZetaChainClient } from "@/hooks/useZetaChainClient"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import SwapToAnyToken from "./SwapToAnyToken.json"

const roundToSignificantDigits = (
  value: number,
  significantDigits: number
): number => {
  if (value === 0) return 0
  const digits =
    -Math.floor(Math.log10(Math.abs(value))) + (significantDigits - 1)
  const factor = Math.pow(10, digits)
  return Math.round(value * factor) / factor
}

const roundNumber = (value: number): number => {
  if (value >= 1) {
    return parseFloat(value.toFixed(1))
  } else {
    return roundToSignificantDigits(value, 2)
  }
}

const formatAddress = (address: any) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const Swap = () => {
  const { client } = useZetaChainClient()
  const omnichainSwapContractAddress =
    "0xb459F14260D1dc6484CE56EB0826be317171e91F"
  const { isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const {
    balances,
    balancesLoading,
    bitcoinAddress,
    setInbounds,
    inbounds,
    fees,
  } = useAppContext()
  const { chain } = useNetwork()

  const signer = useEthersSigner()

  const [sourceAmount, setSourceAmount] = useState<any>(false)
  const [sourceToken, setSourceToken] = useState<any>()
  const [sourceTokenOpen, setSourceTokenOpen] = useState(false)
  const [sourceTokenSelected, setSourceTokenSelected] = useState<any>()
  const [sourceBalances, setSourceBalances] = useState<any>()
  const [destinationToken, setDestinationToken] = useState<any>()
  const [destinationTokenSelected, setDestinationTokenSelected] =
    useState<any>()
  const [destinationTokenOpen, setDestinationTokenOpen] = useState(false)
  const [destinationAmount, setDestinationAmount] = useState("")
  const [destinationAmountIsLoading, setDestinationAmountIsLoading] =
    useState(false)
  const [destinationBalances, setDestinationBalances] = useState<any>()
  const [isRightChain, setIsRightChain] = useState(true)
  const [crossChainFee, setCrossChainFee] = useState<any>()
  const [isSending, setIsSending] = useState(false)
  const [addressSelected, setAddressSelected] = useState<any>(null)
  const [isAddressSelectedValid, setIsAddressSelectedValid] = useState(false)
  const [canChangeAddress, setCanChangeAddress] = useState(false)
  const [customAddress, setCustomAddress] = useState("")
  const [customAddressSelected, setCustomAddressSelected] = useState("")
  const [customAddressOpen, setCustomAddressOpen] = useState(false)
  const [isCustomAddressValid, setIsCustomAddressValid] = useState(false)
  const [isAmountGTFee, setIsAmountGTFee] = useState(false)
  const [isAmountLTBalance, setIsAmountLTBalance] = useState(false)
  const [isFeeOpen, setIsFeeOpen] = useState(false)
  const [sendButtonText, setSendButtonText] = useState("Send tokens")

  const computeSendType = (s: any, d: any) => {
    if (!s || !d) return null

    const fromZETA = /\bzeta\b/i.test(s?.symbol)
    const fromZETAorWZETA = /\bw?zeta\b/i.test(s?.symbol)
    const fromZetaChain = s.chain_name === "zeta_testnet"
    const fromBTC = s.symbol === "tBTC"
    const fromBitcoin = s.chain_name === "btc_testnet"
    const fromWZETA = s.symbol === "WZETA"
    const fromGas = s.coin_type === "Gas"
    const fromERC20 = s.coin_type === "ERC20"
    const toZETAorWZETA = /\bw?zeta\b/i.test(d?.symbol)
    const toWZETA = d.symbol === "WZETA"
    const toZETA = d.symbol === "ZETA"
    const toZetaChain = d.chain_name === "zeta_testnet"
    const toGas = d.coin_type === "Gas"
    const toERC20 = d.coin_type === "ERC20"
    const toZRC20 = d.coin_type === "ZRC20"
    const fromZRC20 = s.coin_type === "ZRC20"
    const toBitcoin = d.chain_name === "btc_testnet"
    const sameToken = s.ticker === d.ticker
    const sameChain = s.chain_name === d.chain_name
    const fromToBitcoin = fromBitcoin && toBitcoin
    const fromToZetaChain = fromZetaChain || toZetaChain
    const fromToZETAorWZETA = fromZETAorWZETA || toZETAorWZETA

    const conditions = {
      crossChainZeta: () => fromZETAorWZETA && toZETAorWZETA && !sameChain,
      wrapZeta: () => fromZETA && toWZETA,
      unwrapZeta: () => fromWZETA && toZETA,
      depositNative: () =>
        sameToken &&
        !fromZetaChain &&
        toZetaChain &&
        fromGas &&
        toZRC20 &&
        !fromBTC,
      depositERC20: () =>
        sameToken &&
        !fromZetaChain &&
        toZetaChain &&
        fromERC20 &&
        toZRC20 &&
        !fromBTC &&
        s.zrc20 === d.contract,
      withdrawZRC20: () =>
        sameToken && fromZetaChain && !toZetaChain && !fromBTC,
      transferNativeEVM: () =>
        sameToken && sameChain && fromGas && toGas && !fromToBitcoin,
      transferERC20EVM: () =>
        sameToken &&
        sameChain &&
        ((fromERC20 && toERC20) || (fromZRC20 && toZRC20)) &&
        !fromToBitcoin,
      crossChainSwap: () =>
        !fromToZetaChain && !fromToZETAorWZETA && !sameChain && !fromBTC,
      // crossChainSwapBTC: () =>
      //   fromBTC && !toBitcoin && !fromToZetaChain && !toZETAorWZETA,
      // crossChainSwapBTCTransfer: () =>
      //   fromBTC && !fromZetaChain && toZetaChain && toZRC20,
      crossChainSwapTransfer: () =>
        !fromZetaChain &&
        toZetaChain &&
        (toZRC20 || toZETA) &&
        !fromZETAorWZETA,
      // transferBTC: () => fromToBitcoin,
      // depositBTC: () => fromBTC && !fromZetaChain && toZetaChain,
      // withdrawBTC: () => fromBTC && fromZetaChain && !toZetaChain,
      fromZetaChainSwapAndWithdraw: () =>
        fromZetaChain && !toZetaChain && !toZETAorWZETA && (toERC20 || toGas),
      fromZetaChainSwap: () =>
        fromZetaChain &&
        toZetaChain &&
        !(fromWZETA || toWZETA) &&
        (toZRC20 || toZETA),
    }

    const result = Object.entries(conditions).find(([_, check]) => check())
    return result ? result[0] : null
  }

  const sendType = computeSendType(
    sourceTokenSelected,
    destinationTokenSelected
  )

  const [errors, setErrors] = useState<any>({
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

  const priorityErrors = Object.entries(errors)
    .filter(([key, value]: [string, any]) => value.enabled)
    .sort((a: any, b: any) => b[1].priority - a[1].priority)
    .map(([key, value]) => value)

  const { address } = useAccount()

  // Set source token details
  useEffect(() => {
    const token = sourceBalances?.find((b: any) => b.id === sourceToken)
    setSourceTokenSelected(token ? token : false)
  }, [sourceToken])

  // Set destination token details
  useEffect(() => {
    const token = balances.find((b: any) => b.id === destinationToken)
    setDestinationTokenSelected(token ? token : false)
  }, [destinationToken])

  useEffect(() => {
    const fetchCrossChainFee = async () => {
      setCrossChainFee(null)
      const fee = await getCrossChainFee(
        sourceTokenSelected,
        destinationTokenSelected
      )
      setCrossChainFee(fee)
    }
    fetchCrossChainFee()
  }, [sourceTokenSelected, destinationTokenSelected])

  const getCrossChainFee = async (s: any, d: any) => {
    if (!sendType) return
    if (["crossChainZeta"].includes(sendType)) {
      if (!fees) return
      const dest = d?.chain_name
      const toZetaChain = dest === "zeta_testnet"
      const fee = fees["messaging"].find((f: any) => f.chainID === d.chain_id)
      const amount = toZetaChain ? 0 : parseFloat(fee.totalFee)
      const formatted =
        amount === 0 ? "Fee: 0 ZETA" : `Fee: ~${roundNumber(amount)} ZETA`
      return {
        amount,
        decimals: 18,
        symbol: "ZETA",
        formatted,
      }
    }
    if (
      [
        "withdrawZRC20",
        "crossChainSwap",
        "fromZetaChainSwapAndWithdraw",
      ].includes(sendType)
    ) {
      const st = s.coin_type === "ZRC20" ? s.contract : s.zrc20
      const dt = d.coin_type === "ZRC20" ? d.contract : d.zrc20
      if (st && dt) {
        const fee = await client.getWithdrawFeeInInputToken(st, dt)
        const feeAmount = roundNumber(
          parseFloat(utils.formatUnits(fee.amount, fee.decimals))
        )
        return {
          amount: utils.formatUnits(fee.amount, fee.decimals),
          symbol: s.symbol,
          decimals: fee.decimals,
          formatted: `Fee: ${feeAmount} ${s.symbol}`,
        }
      }
    }
  }

  // Set whether address can be changed
  useEffect(() => {
    setCanChangeAddress(
      [
        "transferNativeEVM",
        "transferERC20EVM",
        "crossChainSwap",
        "transferBTC",
      ].includes(sendType as any)
    )
  }, [sourceAmount, sendType, destinationTokenSelected])

  // Set destination amount
  useEffect(() => {
    setDestinationAmount("")
    updateError("insufficientLiquidity", { enabled: false })
    const fetchQuoteCrossChain = async (
      s: any,
      d: any,
      sourceAmount: any,
      withdraw: boolean
    ) => {
      setDestinationAmount("")
      setDestinationAmountIsLoading(true)
      try {
        const quote = await getQuoteCrossChain(s, d, sourceAmount, withdraw)
        if (quote) {
          setDestinationAmount(roundNumber(parseFloat(quote)).toString())
          setDestinationAmountIsLoading(false)
        }
      } catch (e) {
        console.error(e)
        updateError("insufficientLiquidity", { enabled: true })
        setDestinationAmountIsLoading(false)
      }
    }
    const debouncedFetchQuoteCrossChain = debounce(fetchQuoteCrossChain, 500)
    if (!sendType) {
      setDestinationAmountIsLoading(false)
      return
    }
    if (
      [
        "crossChainSwap",
        "crossChainSwapBTC",
        "fromZetaChainSwapAndWithdraw",
      ].includes(sendType)
    ) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected,
        destinationTokenSelected,
        sourceAmount,
        true
      )
    } else if (
      ["crossChainSwapBTCTransfer", "crossChainSwapTransfer"].includes(sendType)
    ) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected,
        destinationTokenSelected,
        sourceAmount,
        false
      )
    } else if (["crossChainZeta"].includes(sendType)) {
      const delta = parseFloat(sourceAmount) - crossChainFee?.amount
      if (sourceAmount && delta > 0) {
        setDestinationAmount(delta.toFixed(2).toString())
      }
    } else if (["fromZetaChainSwap"].includes(sendType)) {
      debouncedFetchQuoteCrossChain(
        sourceTokenSelected,
        destinationTokenSelected,
        sourceAmount,
        false
      )
    } else {
      setDestinationAmount(sourceAmount)
    }
    return () => {
      debouncedFetchQuoteCrossChain.cancel()
    }
  }, [
    sourceTokenSelected,
    destinationTokenSelected,
    sourceAmount,
    crossChainFee,
  ])

  const getQuoteCrossChain = async (
    s: any,
    d: any,
    sourceAmount: any,
    withdraw: boolean
  ) => {
    const dIsZRC20 = d?.zrc20 || (d?.coin_type === "ZRC20" && d?.contract)
    const isAmountValid = sourceAmount && parseFloat(sourceAmount)
    const WZETA = balances.find((b: any) => b.id === "7001__wzeta")
    const dIsZETA = d.coin_type === "Gas" && d.chain_id === 7001
    const sIsZETA = s.coin_type === "Gas" && d.chain_id === 7001
    let sourceAddress
    if (s.coin_type === "ZRC20") {
      sourceAddress = s.contract
    } else if (sIsZETA) {
      sourceAddress = WZETA.contract
    } else {
      sourceAddress = s.zrc20
    }
    if (!isAmountValid) return "0"
    if (isAmountValid > 0 && (dIsZRC20 || dIsZETA) && sourceAddress) {
      let amount
      if (withdraw && crossChainFee) {
        const AmountMinusFee = utils
          .parseUnits(sourceAmount, sourceTokenSelected.decimals)
          .sub(utils.parseUnits(crossChainFee.amount, crossChainFee.decimals))

        amount = utils.formatUnits(AmountMinusFee, sourceTokenSelected.decimals)
      } else {
        amount = sourceAmount
      }
      const target = d.coin_type === "ZRC20" ? d.contract : d.zrc20
      const dAddress = dIsZETA ? WZETA.contract : target
      const q = await client.getQuote(amount, sourceAddress, dAddress)
      return utils.formatUnits(q.amount, q.decimals)
    }
  }

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

  // Set whether amount is valid
  useEffect(() => {
    const am = parseFloat(sourceAmount || "0")
    const ltBalance = am >= 0 && am <= parseFloat(sourceTokenSelected?.balance)
    if (["crossChainZeta"].includes(sendType as any)) {
      const gtFee = am > parseFloat(crossChainFee?.amount)
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else if (
      ["crossChainSwap", "crossChainSwapBTC"].includes(sendType as any)
    ) {
      const gtFee = parseFloat(sourceAmount) > parseFloat(crossChainFee?.amount)
      setIsAmountGTFee(gtFee)
      setIsAmountLTBalance(ltBalance)
    } else {
      setIsAmountGTFee(true)
      setIsAmountLTBalance(ltBalance)
    }
  }, [sourceAmount, crossChainFee, sendType, destinationAmount])

  // Set destination address
  useEffect(() => {
    if (!isAddressSelectedValid && destinationTokenSelected) {
      if (destinationTokenSelected.chain_name === "btc_testnet") {
        setAddressSelected(bitcoinAddress)
      } else {
        setAddressSelected(address)
      }
    }
  }, [destinationTokenSelected, isAddressSelectedValid])

  useEffect(() => {
    setAddressSelected(customAddressSelected || address)
  }, [customAddressSelected, address])

  const saveCustomAddress = () => {
    if (isCustomAddressValid) {
      setCustomAddressSelected(customAddress)
      setCustomAddress(customAddress)
      setCustomAddressOpen(false)
    }
  }

  // Set whether the custom destination address is valid
  useEffect(() => {
    let isValidBech32 = false
    try {
      if (bech32.decode(customAddress)) {
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

  const sendDisabled =
    !sendType ||
    !isAmountGTFee ||
    !isAmountLTBalance ||
    isSending ||
    !isAddressSelectedValid ||
    destinationAmountIsLoading ||
    !destinationAmount ||
    balancesLoading

  useEffect(() => {
    if (isSending) {
      setSendButtonText("Sending...")
    } else if (sendDisabled && priorityErrors.length > 0) {
      setSendButtonText((priorityErrors as any)[0].message)
    } else {
      setSendButtonText("Send Tokens")
    }
  }, [destinationAmountIsLoading, sendDisabled, priorityErrors])

  // Set whether the selected destination address is valid
  useEffect(() => {
    let isValidBech32 = false
    try {
      if (bech32.decode(addressSelected)) {
        const bech32address = utils.solidityPack(
          ["bytes"],
          [utils.toUtf8Bytes(addressSelected)]
        )
        if (bech32address) {
          isValidBech32 = true
        }
      }
    } catch (e) {}
    const isValidEVMAddress = ethers.utils.isAddress(addressSelected)
    if (!destinationTokenSelected) {
      setIsAddressSelectedValid(true)
    } else if (destinationTokenSelected?.chain_name === "btc_testnet") {
      setIsAddressSelectedValid(isValidBech32)
    } else {
      setIsAddressSelectedValid(isValidEVMAddress)
    }
  }, [addressSelected, destinationTokenSelected])

  // Set whether the chain currently selected is the right one
  useEffect(() => {
    if (sourceTokenSelected?.chain_name === "btc_testnet") {
      setIsRightChain(true)
    } else if (chain && sourceTokenSelected) {
      setIsRightChain(
        chain.id.toString() === sourceTokenSelected.chain_id.toString()
      )
    }
  }, [chain, sourceTokenSelected])

  const sendTypeDetails: any = {
    crossChainZeta: { title: "Transfer" },
    wrapZeta: { title: "Wrap" },
    unwrapZeta: { title: "Unwrap" },
    depositNative: { title: "Deposit" },
    depositERC20: { title: "Deposit" },
    withdrawZRC20: { title: "Withdraw" },
    transferNativeEVM: { title: "Send" },
    transferERC20EVM: { title: "Send" },
    crossChainSwap: { title: "Swap" },
    crossChainSwapBTC: { title: "Swap" },
    crossChainSwapBTCTransfer: { title: "Deposit and Swap" },
    crossChainSwapTransfer: { title: "Deposit and Swap" },
    transferBTC: { title: "Send" },
    depositBTC: { title: "Deposit" },
    withdrawBTC: { title: "Withdraw" },
    fromZetaChainSwapAndWithdraw: { title: "Swap and Withdraw" },
  }

  // Set source and destination balances
  useEffect(() => {
    setSourceBalances(
      balances
        .filter((b: any) => b.balance > 0)
        .sort((a: any, b: any) => (a.chain_name < b.chain_name ? -1 : 1))
    )
    setDestinationBalances(
      balances
        .filter((b: any) =>
          b.chain_name === "btc_testnet" ? bitcoinAddress : true
        )
        .sort((a: any, b: any) => (a.chain_name < b.chain_name ? -1 : 1))
    )
  }, [balances])

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

  let m = {} as any

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

  const handleSend = async () => {
    setIsSending(true)

    if (!address) {
      setIsSending(false)
      throw new Error("Address undefined.")
    }

    try {
      await m[sendType as keyof typeof m]()
      setSourceAmount("")
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  const handleSwitchNetwork = async () => {
    const chain_id = sourceTokenSelected?.chain_id
    if (chain_id) {
      switchNetwork?.(chain_id)
    }
  }

  return (
    <div className="shadow-none md:shadow-xl p-0 md:px-5 md:py-7 rounded-2xl md:shadow-gray-100 mb-10">
      <h1 className="text-2xl font-bold leading-tight tracking-tight mt-6 mb-4 ml-2">
        {sendTypeDetails[sendType as any]?.title || "Swap"}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Input
            className="col-span-2 h-full text-xl border-none"
            onChange={(e) => setSourceAmount(e.target.value)}
            placeholder="0"
            value={sourceAmount}
            disabled={isSending || balancesLoading}
            type="number"
            step="any"
          />
          <Popover open={sourceTokenOpen} onOpenChange={setSourceTokenOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={balancesLoading}
                aria-expanded={sourceTokenOpen}
                className="justify-between col-span-2 text-left h-full overflow-x-hidden border-none"
              >
                <div className="flex flex-col w-full items-start">
                  <div className="text-xs w-full flex justify-between">
                    <div>
                      {sourceTokenSelected
                        ? sourceTokenSelected.symbol
                        : "Token"}
                    </div>
                    <div>
                      {sourceTokenSelected &&
                        parseFloat(sourceTokenSelected.balance).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {sourceTokenSelected
                      ? sourceTokenSelected.chain_name
                      : "Send token"}
                  </div>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-75" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 border-none shadow-2xl">
              <Command>
                <CommandInput placeholder="Search tokens..." />
                <CommandEmpty>No available tokens found.</CommandEmpty>
                <CommandGroup className="max-h-[400px] overflow-y-scroll">
                  {sourceBalances?.map((balances: any) => (
                    <CommandItem
                      key={balances.id}
                      className="hover:cursor-pointer"
                      value={balances.id}
                      onSelect={(c) => {
                        setSourceToken(c === sourceToken ? null : c)
                        setSourceTokenOpen(false)
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          sourceToken === balances.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <div className="w-full">
                        <div className="flex justify-between">
                          <div>{balances.symbol}</div>
                          <div>{parseFloat(balances.balance).toFixed(2)}</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {balances.chain_name}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="col-span-2 relative">
            <Input
              className="text-xl h-full border-none"
              type="number"
              placeholder=""
              value={destinationAmount}
              disabled={true}
            />
            {destinationAmountIsLoading && (
              <div className="translate-y-[-50%] absolute top-[50%] left-[1rem]">
                <Loader2 className="h-6 w-6 animate-spin opacity-40" />
              </div>
            )}
          </div>
          <Popover
            open={destinationTokenOpen}
            onOpenChange={setDestinationTokenOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={balancesLoading}
                aria-expanded={sourceTokenOpen}
                className="justify-between text-left col-span-2 h-full overflow-x-hidden border-none"
              >
                <div className="flex flex-col w-full items-start">
                  <div className="text-xs">
                    {destinationTokenSelected
                      ? destinationTokenSelected.symbol
                      : "Token"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {destinationTokenSelected
                      ? destinationTokenSelected.chain_name
                      : "Receive token"}
                  </div>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-75" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 border-none shadow-2xl">
              <Command>
                <CommandInput placeholder="Search tokens..." />
                <CommandEmpty>No available tokens found.</CommandEmpty>
                <CommandGroup className="max-h-[400px] overflow-y-scroll">
                  {destinationBalances?.map((balances: any) => (
                    <CommandItem
                      key={balances.id}
                      className={`hover:cursor-pointer ${
                        !computeSendType(sourceTokenSelected, balances) &&
                        "opacity-25"
                      }`}
                      value={balances.id}
                      disabled={!computeSendType(sourceTokenSelected, balances)}
                      onSelect={(c) => {
                        setDestinationToken(c === destinationToken ? null : c)
                        setDestinationTokenOpen(false)
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          destinationToken === balances.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <div className="w-full">
                        <div className="flex justify-between">
                          <div>{balances.symbol}</div>
                          <div>{parseFloat(balances.balance).toFixed(2)}</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {balances.chain_name}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-x-2 flex ml-2 mt-6">
          {addressSelected && (
            <Popover
              open={customAddressOpen}
              onOpenChange={setCustomAddressOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  disabled={!canChangeAddress}
                  variant="outline"
                  className="rounded-full text-xs h-6 px-2"
                >
                  {isAddressSelectedValid ? (
                    <UserCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  <div>{formatAddress(addressSelected)}</div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="rounded-xl flex p-2 border-none shadow-xl space-x-2 w-[390px]">
                <Input
                  className="grow border-none text-xs px-2"
                  placeholder="Recipient address"
                  onChange={(e) => setCustomAddress(e.target.value)}
                  value={customAddress}
                />
                <div>
                  <Button
                    disabled={!isCustomAddressValid}
                    size="icon"
                    variant="outline"
                    onClick={saveCustomAddress}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {crossChainFee?.formatted && (
            <Popover open={isFeeOpen} onOpenChange={setIsFeeOpen}>
              <PopoverTrigger asChild>
                <Button
                  // disabled={true}
                  variant="outline"
                  className="rounded-full text-xs h-6 px-3 whitespace-nowrap overflow-hidden"
                >
                  {crossChainFee.formatted}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="rounded-xl w-auto text-xs border-none shadow-2xl">
                <div className="font-medium text-center">Cross-Chain Fee</div>
                <div className="text-slate-400">{crossChainFee?.amount}</div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="ml-2 mt-6">
          {isRightChain ? (
            <div>
              <Button
                variant="outline"
                onClick={handleSend}
                disabled={sendDisabled}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {sendButtonText}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleSwitchNetwork}
              disabled={
                isLoading && pendingChainId === sourceTokenSelected.chain_id
              }
            >
              {isLoading && pendingChainId === sourceTokenSelected.chain_id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Switch Network
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default Swap
