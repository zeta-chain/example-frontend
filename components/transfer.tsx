"use client"

// @ts-ignore
import { parse } from "path"
import { use, useCallback, useContext, useEffect, useState } from "react"
import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"
import UniswapV2Factory from "@uniswap/v2-periphery/build/IUniswapV2Router02.json"
import { getEndpoints } from "@zetachain/networks/dist/src/getEndpoints"
import { getAddress } from "@zetachain/protocol-contracts"
import WETH9 from "@zetachain/protocol-contracts/abi/zevm/WZETA.sol/WETH9.json"
import ZRC20 from "@zetachain/protocol-contracts/abi/zevm/ZRC20.sol/ZRC20.json"
import {
  getForeignCoins,
  prepareData,
  sendZETA,
  sendZRC20,
} from "@zetachain/toolkit/helpers"
import bech32 from "bech32"
import { ethers, utils } from "ethers"
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Coins,
  Loader2,
  RefreshCcw,
  Send,
  UserCircle2,
} from "lucide-react"
import { set } from "react-hook-form"
import { useDebounce } from "use-debounce"
import { parseEther, parseUnits } from "viem"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import AppContext from "@/app/app"

const Transfer = () => {
  const omnichainSwapContractAddress =
    "0x102Fa443F05200bB74aBA1c1F15f442DbEf32fFb"
  const { isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const [open, setOpen] = useState(false)
  const {
    balances,
    bitcoinAddress,
    setInbounds,
    inbounds,
    fees,
    foreignCoins,
  } = useContext(AppContext)
  const { chain } = useNetwork()

  const signer = useEthersSigner()

  const [sourceToken, setSourceToken] = useState<any>()
  const [sourceTokenSelected, setSourceTokenSelected] = useState<any>()
  const [destinationToken, setDestinationToken] = useState<any>()
  const [destinationTokenSelected, setDestinationTokenSelected] =
    useState<any>()
  const [destinationTokenOpen, setDestinationTokenOpen] = useState(false)
  const [destinationAmount, setDestinationAmount] = useState("")
  const [isRightChain, setIsRightChain] = useState(true)
  const [sendType, setSendType] = useState<any>()
  const [crossChainFee, setCrossChainFee] = useState<any>()
  const [amount, setAmount] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [canChangeAddress, setCanChangeAddress] = useState(false)
  const [customAddress, setCustomAddress] = useState("")
  const [customAddressSelected, setCustomAddressSelected] = useState("")
  const [addressSelected, setAddressSelected] = useState<any>(null)
  const [customAddressOpen, setCustomAddressOpen] = useState(false)
  const [isCustomAddressValid, setIsCustomAddressValid] = useState(false)
  const [isAddressSelectedValid, setIsAddressSelectedValid] = useState(false)
  const [isAmountValid, setIsAmountValid] = useState(false)
  const [isFeeOpen, setIsFeeOpen] = useState(false)

  const [debouncedAmount] = useDebounce(amount, 500)
  const { address } = useAccount()

  const formatAddress = (address: any) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  useEffect(() => {
    const token = balancesFrom.find((b: any) => b.id === sourceToken)
    setSourceTokenSelected(token ? token : null)
  }, [sourceToken])

  useEffect(() => {
    const token = balances.find((b: any) => b.id === destinationToken)
    setDestinationTokenSelected(token ? token : null)
  }, [destinationToken])

  useEffect(() => {
    if (fees) {
      if (sendType === "crossChainZeta") {
        const amount = parseFloat(
          fees?.["feesCCM"][destinationTokenSelected.chain_name]?.totalFee
        )
        setCrossChainFee({
          amount,
          symbol: "ZETA",
          formatted: `~${amount.toFixed(2)} ZETA`,
        })
      } else if (sendType === "crossChainSwap") {
        const fee =
          fees?.["feesZEVM"][destinationTokenSelected?.chain_name]?.totalFee
        const amount = parseFloat(fee)
        const symbol = foreignCoins.find((c: any) => {
          if (
            c?.foreign_chain_id === destinationTokenSelected?.chain_id &&
            c?.coin_type === "Gas"
          ) {
            return c
          }
        })?.symbol
        setCrossChainFee({
          amount,
          symbol,
          formatted: `~${amount.toFixed(2)} ${symbol}`,
        })
      } else {
        setCrossChainFee(null)
      }
    }

    setCanChangeAddress(
      [
        "transferNativeEVM",
        "transferERC20EVM",
        "crossChainSwap",
        "transferBTC",
      ].includes(sendType)
    )
  }, [amount, sendType, destinationTokenSelected])

  const getQuoteCrossChainSwap = useCallback(async () => {
    if (
      amount &&
      parseFloat(amount) > 0 &&
      (destinationTokenSelected?.zrc20 ||
        (destinationTokenSelected?.coin_type === "ZRC20" &&
          destinationTokenSelected?.contract)) &&
      sourceTokenSelected?.zrc20
    ) {
      const rpc = getEndpoints("evm", "zeta_testnet")[0]?.url
      const provider = new ethers.providers.JsonRpcProvider(rpc)
      const routerAddress = getAddress("uniswapv2Router02", "zeta_testnet")
      const router = new ethers.Contract(
        routerAddress,
        UniswapV2Factory.abi,
        provider
      )

      const amountIn = ethers.utils.parseEther(amount)
      const zetaToken = "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf"
      const srcToken = sourceTokenSelected.zrc20
      const dstToken =
        destinationTokenSelected.coin_type === "ZRC20"
          ? destinationTokenSelected.contract
          : destinationTokenSelected.zrc20
      let zetaOut
      try {
        zetaOut = await router.getAmountsOut(
          parseUnits(amount, sourceTokenSelected.decimals),
          [srcToken, zetaToken]
        )
      } catch (e) {
        console.error(e)
      }
      let dstOut
      try {
        dstOut = await router.getAmountsOut(zetaOut[1], [zetaToken, dstToken])
        setDestinationAmount(
          parseFloat(
            ethers.utils.formatUnits(
              dstOut[1],
              destinationTokenSelected.decimals
            )
          ).toFixed(2)
        )
      } catch (e) {
        console.error(e)
      }
    }
  }, [amount, sourceTokenSelected, destinationTokenSelected])

  useEffect(() => {
    setDestinationAmount("")
    if (
      [
        "crossChainSwap",
        "crossChainSwapBTC",
        "crossChainSwapBTCTransfer",
        "crossChainSwapTransfer",
      ].includes(sendType)
    ) {
      getQuoteCrossChainSwap()
    } else if (["crossChainZeta"].includes(sendType)) {
      const delta = parseFloat(amount) - crossChainFee?.amount
      if (amount && delta > 0) {
        setDestinationAmount(delta.toFixed(2).toString())
      }
    }
  }, [amount, sourceTokenSelected, destinationTokenSelected, crossChainFee])

  useEffect(() => {
    const gtBalance =
      parseFloat(amount) > 0 &&
      parseFloat(amount) <= parseFloat(sourceTokenSelected?.balance)
    if (["crossChainZeta"].includes(sendType)) {
      const gtFee = parseFloat(amount) > parseFloat(crossChainFee?.amount)
      setIsAmountValid(gtBalance && gtFee)
    } else {
      setIsAmountValid(gtBalance)
    }
  }, [amount, crossChainFee, sendType])

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

  useEffect(() => {
    if (sourceTokenSelected?.chain_name === "btc_testnet") {
      setIsRightChain(true)
    } else if (chain && sourceTokenSelected) {
      setIsRightChain(
        chain.id.toString() === sourceTokenSelected.chain_id.toString()
      )
    }
  }, [chain, sourceTokenSelected])

  useEffect(() => {
    const s = sourceTokenSelected
    const d = destinationTokenSelected
    const t = (x: any) => setSendType(x)
    if (s && d) {
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
      const toBitcoin = d.chain_name === "btc_testnet"
      const sameToken = s.symbol === d.symbol
      const sameChain = s.chain_name === d.chain_name
      const fromToBitcoin = fromBitcoin && toBitcoin
      const fromToZetaChain = fromZetaChain && toZetaChain
      const fromToZETAorWZETA = fromZETAorWZETA || toZETAorWZETA

      if (fromZETAorWZETA && toZETAorWZETA && !sameChain)
        return t("crossChainZeta")
      if (fromZETA && toWZETA) return t("wrapZeta")
      if (fromWZETA && toZETA) return t("unwrapZeta")
      if (sameToken && !fromZetaChain && toZetaChain && !fromBTC)
        return t("depositZRC20")
      if (sameToken && fromZetaChain && !toZetaChain && !fromBTC)
        return t("withdrawZRC20")
      if (sameToken && sameChain && fromGas && toGas && !fromToBitcoin)
        return t("transferNativeEVM")
      if (sameToken && sameChain && fromERC20 && toERC20 && !fromToBitcoin)
        return t("transferERC20EVM")
      if (!fromToZetaChain && !fromToZETAorWZETA && !sameChain && !fromBTC)
        return t("crossChainSwap")
      if (fromBTC && !toBitcoin && !fromToZetaChain && !toZETAorWZETA)
        return t("crossChainSwapBTC")
      if (fromBTC && !fromZetaChain && toZetaChain && toZRC20)
        return t("crossChainSwapBTCTransfer")
      if (!fromZetaChain && toZetaChain && toZRC20 && !fromToZETAorWZETA)
        return t("crossChainSwapTransfer")
      if (fromToBitcoin) return t("transferBTC")
      if (fromBTC && !fromZetaChain && toZetaChain) return t("depositBTC")
      if (fromBTC && fromZetaChain && !toZetaChain) return t("withdrawBTC")
    }
    t(null)
  }, [sourceTokenSelected, destinationTokenSelected])

  const amountGTBalance =
    parseFloat(amount) > parseFloat(sourceTokenSelected?.balance)

  const balancesFrom = balances
    .filter((b: any) => b.balance > 0)
    .sort((a: any, b: any) => {
      if (a.chain_name < b.chain_name) {
        return -1
      }
      if (a.chain_name > b.chain_name) {
        return 1
      }
      return 0
    })

  const destinationBalances = balances
    .filter((b: any) => {
      if (b.chain_name === "btc_testnet") {
        return bitcoinAddress
      } else {
        return true
      }
    })
    .sort((a: any, b: any) => {
      if (a.chain_name < b.chain_name) {
        return -1
      }
      if (a.chain_name > b.chain_name) {
        return 1
      }
      return 0
    })

  const depositBTC = () => {
    if (!address) {
      console.error("EVM address undefined.")
      return
    }
    if (!bitcoinAddress) {
      console.error("Bitcoin address undefined.")
      return
    }
    const a = parseFloat(amount) * 1e8
    const bitcoinTSSAddress = "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
    const memo = `hex::${address.replace(/^0x/, "")}`
    window.xfi.bitcoin.request(
      {
        method: "transfer",
        params: [
          {
            feeRate: 10,
            from: bitcoinAddress,
            recipient: bitcoinTSSAddress,
            amount: {
              amount: a,
              decimals: 8,
            },
            memo,
          },
        ],
      },
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

  const crossChainSwapBTC = (action: string) => {
    if (!address) {
      console.error("EVM address undefined.")
      return
    }
    if (!bitcoinAddress) {
      console.error("Bitcoin address undefined.")
      return
    }
    const a = parseFloat(amount) * 1e8
    const bitcoinTSSAddress = "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
    const contract = omnichainSwapContractAddress.replace(/^0x/, "")
    const zrc20 = destinationTokenSelected.zrc20.replace(/^0x/, "")
    const dest = address.replace(/^0x/, "")
    const memo = `hex::${contract}${action}${zrc20}${dest}`
    window.xfi.bitcoin.request(
      {
        method: "transfer",
        params: [
          {
            feeRate: 10,
            from: bitcoinAddress,
            recipient: bitcoinTSSAddress,
            amount: {
              amount: a,
              decimals: 8,
            },
            memo,
          },
        ],
      },
      (error: any, hash: any) => {
        if (!error) {
          const inbound = {
            inboundHash: hash,
            desc: `Sent ${amount} tBTC`,
          }
          setInbounds([...inbounds, inbound])
        }
      }
    )
  }

  const transferNativeEVM = async () => {
    await signer?.sendTransaction({
      to: addressSelected,
      value: parseEther(amount),
    })
  }

  const crossChainZeta = async () => {
    const from = sourceTokenSelected.chain_name
    const to = destinationTokenSelected.chain_name
    const tx = await sendZETA(signer, amount, from, to, address as string)
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${amount} ZETA from ${from} to ${to}`,
    }
    setInbounds([...inbounds, inbound])
  }

  const withdrawBTC = async () => {
    const from = sourceTokenSelected.chain_name
    const to = destinationTokenSelected.chain_name
    const btc = bitcoinAddress
    const token = sourceTokenSelected.symbol
    const tx = await sendZRC20(signer, amount, from, to, btc, token)
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${amount} ${token} from ${from} to ${to}`,
    }
    setInbounds([...inbounds, inbound])
  }

  const wrapZeta = async () => {
    signer?.sendTransaction({
      to: getAddress("zetaToken", "zeta_testnet"),
      value: parseEther(amount),
    })
  }

  const unwrapZeta = async () => {
    if (signer) {
      const contract = new ethers.Contract(
        getAddress("zetaToken", "zeta_testnet"),
        WETH9.abi,
        signer
      )
      contract.withdraw(parseEther(amount))
    }
  }

  const transferERC20EVM = async () => {
    const contract = new ethers.Contract(
      sourceTokenSelected.contract,
      ERC20_ABI.abi,
      signer
    )
    const approve = await contract.approve(
      addressSelected,
      parseUnits(amount, sourceTokenSelected.decimals)
    )
    approve.wait()
    const tx = await contract.transfer(
      addressSelected,
      parseUnits(amount, sourceTokenSelected.decimals)
    )
  }

  const withdrawZRC20 = async () => {
    const destination = destinationTokenSelected.chain_name
    const ZRC20Address = getAddress("zrc20", destination)
    const contract = new ethers.Contract(ZRC20Address, ZRC20.abi, signer)
    const value = ethers.utils.parseUnits(
      amount,
      destinationTokenSelected.decimals
    )
    await contract.approve(ZRC20Address, value)
    const to =
      destination === "btc_testnet"
        ? ethers.utils.toUtf8Bytes(bitcoinAddress)
        : addressSelected
    const tx = await contract.withdraw(to, value)
    const token = sourceTokenSelected.symbol
    const from = sourceTokenSelected.chain_name
    const dest = destinationTokenSelected.chain_name
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${amount} ${token} from ${from} to ${dest}`,
    }
    setInbounds([...inbounds, inbound])
  }

  const depositZRC20 = async () => {
    const from = sourceTokenSelected.chain_name
    const to = destinationTokenSelected.chain_name
    const token = sourceTokenSelected.symbol
    const tx = await sendZRC20(
      signer,
      amount,
      from,
      to,
      address as string,
      token
    )
    const inbound = {
      inboundHash: tx.hash,
      desc: `Sent ${amount} ${token} from ${from} to ${to}`,
    }
    setInbounds([...inbounds, inbound])
  }

  const transferBTC = () => {
    if (!bitcoinAddress) {
      console.error("Bitcoin address undefined.")
      return
    }
    const a = parseFloat(amount) * 1e8
    const memo = ""
    window.xfi.bitcoin.request({
      method: "transfer",
      params: [
        {
          feeRate: 10,
          from: bitcoinAddress,
          recipient: addressSelected,
          amount: {
            amount: a,
            decimals: 8,
          },
          memo,
        },
      ],
    })
  }

  const crossChainSwap = async (action: string) => {
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
      ["uint8", "address", "bytes"],
      [action, zrc20, recipient]
    )

    const to = getAddress("tss", sourceTokenSelected.chain_name)
    const value = parseEther(amount)

    const tx = await signer?.sendTransaction({ data, to, value })

    const tiker = sourceTokenSelected.ticker
    const from = sourceTokenSelected.chain_name
    const dest = destinationTokenSelected.chain_name

    if (tx) {
      const inbound = {
        inboundHash: tx.hash,
        desc: `Sent ${amount} ${tiker} from ${from} to ${dest}`,
      }
      setInbounds([...inbounds, inbound])
    }
  }

  const handleSend = async () => {
    setIsSending(true)

    if (!address) {
      setIsSending(false)
      throw new Error("Address undefined.")
    }

    try {
      switch (sendType) {
        case "depositBTC":
          await depositBTC()
          break
        case "crossChainZeta":
          await crossChainZeta()
          break
        case "withdrawBTC":
          await withdrawBTC()
          break
        case "depositZRC20":
          await depositZRC20()
          break
        case "transferNativeEVM":
          await transferNativeEVM()
          break
        case "wrapZeta":
          await wrapZeta()
          break
        case "unwrapZeta":
          await unwrapZeta()
          break
        case "transferERC20EVM":
          await transferERC20EVM()
          break
        case "crossChainSwap":
          await crossChainSwap("1")
          break
        case "withdrawZRC20":
          await withdrawZRC20()
          break
        case "transferBTC":
          await transferBTC()
          break
        case "crossChainSwapTransfer":
          await crossChainSwap("2")
          break
        case "crossChainSwapBTCTransfer":
          await crossChainSwapBTC("02")
          break
        case "crossChainSwapBTC":
          await crossChainSwapBTC("01")
          break
      }
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
    <div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <div className="grid grid-cols-4 gap-4">
          <Input
            className="col-span-2 h-full text-xl"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            value={amount}
            disabled={isSending}
            type="number"
            step="any"
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between col-span-2 h-full overflow-x-hidden"
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
                      : "Please, select token"}
                  </div>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-75" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search tokens..." />
                <CommandEmpty>No balances found.</CommandEmpty>
                <CommandGroup className="max-h-[400px] overflow-y-scroll">
                  {balancesFrom.map((balances: any) => (
                    <CommandItem
                      key={balances.id}
                      value={balances.id}
                      onSelect={(c) => {
                        setSourceToken(c === sourceToken ? null : c)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          sourceToken === balances.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
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
        <div className="grid grid-cols-4 gap-4">
          <Input
            className="col-span-2 h-full text-xl"
            type="number"
            placeholder=""
            value={destinationAmount}
            disabled={true}
          />
          <Popover
            open={destinationTokenOpen}
            onOpenChange={setDestinationTokenOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between col-span-2 h-full overflow-x-hidden"
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
                      : "Please, select token"}
                  </div>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-75" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search tokens..." />
                <CommandEmpty>No balances found.</CommandEmpty>
                <CommandGroup className="max-h-[400px] overflow-y-scroll">
                  {destinationBalances.map((balances: any) => (
                    <CommandItem
                      key={balances.id}
                      value={balances.id}
                      onSelect={(c) => {
                        setDestinationToken(c === destinationToken ? null : c)
                        setDestinationTokenOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          destinationToken === balances.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
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
        <div className="space-x-2 flex">
          {addressSelected && (
            <Popover
              open={customAddressOpen}
              onOpenChange={setCustomAddressOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  disabled={!canChangeAddress}
                  variant="outline"
                  className="rounded-full w-[110px] text-xs h-6 px-3"
                >
                  {isAddressSelectedValid ? (
                    <UserCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {formatAddress(addressSelected)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="rounded-xl flex p-2 space-x-2 w-[390px]">
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
                  className="rounded-full text-xs h-6 px-3"
                >
                  {crossChainFee.formatted}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="rounded-xl w-auto text-sm">
                Cross-Chain Fee
              </PopoverContent>
            </Popover>
          )}
        </div>

        {isRightChain ? (
          <div>
            <Button
              variant="outline"
              type="submit"
              disabled={
                !sendType ||
                !isAmountValid ||
                isSending ||
                !isAddressSelectedValid
              }
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Tokens
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
      </form>
      <div className="text-xs text-slate-300">
        <br />
        {JSON.stringify([sendType])}
      </div>
    </div>
  )
}

export default Transfer
