"use client"

import { useContext, useEffect, useState } from "react"
import Link from "next/link"
import { generatePostBodyBroadcast } from "@evmos/provider"
import {
  createTxMsgDelegate,
  createTxMsgMultipleWithdrawDelegatorReward,
  createTxMsgUndelegate,
  createTxRawEIP712,
  signatureToWeb3Extension,
} from "@evmos/transactions"
import { getEndpoints } from "@zetachain/networks/dist/src/getEndpoints"
import { AlertTriangle, ArrowBigDown, Gift, Globe2, X } from "lucide-react"
import { formatUnits, parseUnits } from "viem"
import { useAccount, useNetwork } from "wagmi"

import { hexToBech32Address } from "@/lib/hexToBech32Address"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { AppContext } from "@/app/index"

const StakingPage = () => {
  const {
    validators,
    fetchValidators,
    fetchStakingDelegations,
    stakingDelegations,
    balances,
    fetchStakingRewards,
    stakingRewards,
  } = useContext(AppContext)
  const [selectedValidator, setSelectedValidator] = useState<any>(null)
  const [isSending, setIsSending] = useState(false)
  const [isZetaChain, setIsZetaChain] = useState(false)
  const [amount, setAmount] = useState<any>("")
  const [withdrawAmount, setWithdrawAmount] = useState<any>("")
  const [redelegateAmount, setRedelegateAmount] = useState<any>("")
  const [pageState, setPageState] = useState<any>()
  const { address } = useAccount()
  const { toast } = useToast()
  const { chain } = useNetwork()

  useEffect(() => {
    setIsZetaChain(chain?.id === 7001)
  }, [chain])

  useEffect(() => {
    fetchStakingDelegations()
    fetchValidators()
    fetchStakingRewards()
  }, [])

  const notZetaChain = chain?.id !== 7001

  const stakingRewardsTotal = stakingRewards.reduce((a: any, c: any) => {
    if (c.reward && c.reward.length > 0) {
      const azetaReward = c.reward.find((r: any) => r.denom === "azeta")
      if (azetaReward) {
        return a + parseFloat(azetaReward.amount)
      }
    }
    return a
  }, 0)

  const stakingAmountTotal = stakingDelegations.reduce((a: any, c: any) => {
    const amount = BigInt(c.balance.amount)
    return a + amount
  }, BigInt(0))

  const findBalance = (chainId: number, coinType: string) => {
    const balance = balances.find(
      (b: any) => b.chain_id === chainId && b.coin_type === coinType
    )
    return balance ? balance.balance : "0"
  }

  const zetaBalance = findBalance(7001, "Gas")

  const handleSelectValidator = (validator: any) => {
    setSelectedValidator(validator)
  }

  const delegatedValidatorAddresses = new Set(
    stakingDelegations.map((d: any) => d.delegation.validator_address)
  )

  const sortedValidators = validators.sort((a: any, b: any) => {
    const aIsDelegated = delegatedValidatorAddresses.has(a.operator_address)
    const bIsDelegated = delegatedValidatorAddresses.has(b.operator_address)
    const aIsJailed = a.jailed
    const bIsJailed = b.jailed

    // Prioritize validators with user delegations first
    if (aIsDelegated && !bIsDelegated) return -1
    if (!aIsDelegated && bIsDelegated) return 1

    // Then sort by jailed status (non-jailed first)
    if (aIsJailed && !bIsJailed) return 1
    if (!aIsJailed && bIsJailed) return -1

    // Finally, sort by voting power
    return b.voting_power - a.voting_power
  })

  const getStakedAmount = (validatorAddress: string) => {
    const delegation = stakingDelegations.find(
      (d: any) => d.delegation.validator_address === validatorAddress
    )
    return delegation ? delegation.balance.amount : null
  }

  const sendCosmosTx = async (
    params: any,
    createTxFunction: (
      chain: any,
      sender: any,
      fee: any,
      memo: string,
      params: any
    ) => any
  ) => {
    const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url
    const accountAddress = hexToBech32Address(address as any, "zeta")
    const url = `${api}/cosmos/auth/v1beta1/accounts/${accountAddress}`
    const broadcastURL = `${api}/cosmos/tx/v1beta1/txs`
    const { account } = await (await fetch(url))?.json()
    const { sequence, account_number } = account?.base_account
    const pubkey = account?.base_account.pub_key.key
    const chain = { chainId: 7001, cosmosChainId: "athens_7001-1" }
    const sender = {
      accountAddress,
      sequence,
      accountNumber: account_number,
      pubkey,
    }
    const fee = {
      amount: "4000000000000000",
      denom: "azeta",
      gas: "200000",
    }
    const memo = ""
    const txDetails = { chain, sender, fee, memo, params }
    const tx = createTxFunction(
      ...(Object.values(txDetails) as [any, any, any, string, any])
    )
    if (address) {
      const signature = await window?.ethereum?.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(tx.eipToSign)],
      })

      const extension = signatureToWeb3Extension(
        chain,
        sender,
        signature as any
      )

      const rawTx = createTxRawEIP712(
        tx.legacyAmino.body,
        tx.legacyAmino.authInfo,
        extension
      )
      const post = await fetch(broadcastURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: generatePostBodyBroadcast({
          message: {
            toBinary() {
              return rawTx.message.serializeBinary()
            },
          },
          path: rawTx.path,
        }),
      })
      return await post.json()
    }
  }

  const handleClaimReward = async () => {
    let result: any = null
    try {
      result = await sendCosmosTx(
        {
          validatorAddresses: stakingRewards.map(
            (r: any) => r.validator_address
          ),
        },
        createTxMsgMultipleWithdrawDelegatorReward
      )
    } catch (e) {
      console.error(e)
    } finally {
      if (result) {
        const success = result?.tx_response?.code === 0
        const title = success ? "Success" : "Error"
        const description = success ? "All good." : result?.tx_response?.raw_log
        toast({
          title,
          description,
          variant: success ? "default" : "destructive",
        })
      }
    }
  }

  const handleWithdraw = async () => {
    setIsSending(true)
    let result: any = null
    try {
      result = await sendCosmosTx(
        {
          validatorAddress: selectedValidator.operator_address,
          amount: parseUnits(amount, 18).toString(),
          denom: "azeta",
        },
        createTxMsgUndelegate
      )
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
      setAmount("")
      if (result) {
        const success = result?.tx_response?.code === 0
        const title = success ? "Success" : "Error"
        const description = success
          ? "Successfully delegated."
          : result?.tx_response?.raw_log
        toast({
          title,
          description,
          variant: success ? "default" : "destructive",
        })
      }
    }
  }

  const handleStake = async () => {
    setIsSending(true)
    let result: any = null
    try {
      result = await sendCosmosTx(
        {
          validatorAddress: selectedValidator.operator_address,
          amount: parseUnits(amount, 18).toString(),
          denom: "azeta",
        },
        createTxMsgDelegate
      )
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
      setAmount("")
      if (result) {
        const success = result?.tx_response?.code === 0
        const title = success ? "Success" : "Error"
        const description = success
          ? "Successfully delegated."
          : result?.tx_response?.raw_log
        toast({
          title,
          description,
          variant: success ? "default" : "destructive",
        })
      }
    }
  }

  const LoadingSkeleton = () => {
    return (
      <div className="space-y-4">
        {Array(10)
          .fill(null)
          .map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
      </div>
    )
  }

  const changePageState = (state: string) => () => {
    if (state === "withdraw") {
      setWithdrawAmount(
        parseFloat(getStakedAmount(selectedValidator.operator_address)) / 1e18
      )
    }
    setPageState(state)
  }

  const ValidatorTable = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead>Validator</TableHead>
            <TableHead className="text-right">Staked</TableHead>
            <TableHead className="text-right">Voting&nbsp;power</TableHead>
            <TableHead className="text-right">Commission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedValidators.map((v: any) => {
            const stakedAmount = getStakedAmount(v.operator_address)
            return (
              <TableRow
                key={v.operator_address}
                className={`border-none cursor-pointer ${
                  v.jailed ? "text-gray-300" : ""
                }`}
                onClick={() => handleSelectValidator(v)}
              >
                <TableCell className="pl-4 rounded-bl-xl rounded-tl-xl">
                  {v.description.moniker}
                </TableCell>
                <TableCell className="text-right">
                  {stakedAmount &&
                    `${(parseFloat(stakedAmount) / 1e18).toFixed(2)}`}
                </TableCell>
                <TableCell className="text-right">
                  <span>{parseFloat(v.voting_power).toFixed(2)}</span>%
                </TableCell>
                <TableCell className="rounded-br-xl rounded-tr-xl text-right">
                  <span>
                    {(
                      parseFloat(v.commission.commission_rates.rate) * 100
                    ).toFixed(0)}
                  </span>
                  %
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="grid sm:grid-cols-3 gap-x-10 mt-12">
      <div className="sm:col-span-2 overflow-x-scroll">
        <h1 className="leading-10 text-2xl font-bold tracking-tight pl-4 mb-6">
          Staking
        </h1>
        <div className="mb-6">
          <Card className="py-6 shadow-none border-none mb-2">
            <div className="grid sm:grid-cols-3 grid-cols-1 gap-2">
              <div className="border border-gray-100 p-4 rounded-2xl">
                <div className="text-sm text-muted-foreground mb-1">
                  Available
                </div>
                <div className="text-xl flex items-center font-semibold">
                  {parseFloat(zetaBalance).toFixed(4)} ZETA
                </div>
              </div>
              <div className="border border-gray-100 p-4 rounded-2xl mb-1">
                <div className="text-sm text-muted-foreground mb-1">Staked</div>
                <div className="text-xl flex items-center">
                  {parseFloat(formatUnits(stakingAmountTotal, 18)).toFixed(2)}
                  &nbsp;ZETA
                </div>
              </div>
              <div>
                <div className="border border-gray-100 p-4 rounded-t-2xl mb-1">
                  <div className="text-sm text-muted-foreground mb-1">
                    Rewards
                  </div>
                  <div className="text-xl flex items-center">
                    {parseFloat(formatUnits(stakingRewardsTotal, 18)).toFixed(
                      4
                    )}
                    &nbsp;ZETA
                  </div>
                </div>
                <Button
                  onClick={handleClaimReward}
                  disabled={!isZetaChain}
                  variant="outline"
                  className="w-full hover:bg-gray-100 bg-white border border-gray-100 rounded-t-none rounded-b-2xl font-semibold"
                >
                  <Gift className="w-4 h-4 mr-1" />
                  Claim rewards
                </Button>
              </div>
            </div>
          </Card>
        </div>
        <div>
          {validators.length > 0 ? (
            <ValidatorTable />
          ) : (
            <div className="pl-4">
              <LoadingSkeleton />
            </div>
          )}
        </div>
      </div>
      <div className="sm:col-span-1 relative order-first sm:order-last">
        {selectedValidator && (
          <div className="sticky top-20 shadow-none md:shadow-xl p-0 md:px-4 md:py-7 rounded-2xl md:shadow-gray-100 mb-10">
            <h1 className="text-2xl font-bold leading-tight tracking-tight mt-6 mb-4 ml-3">
              {selectedValidator?.description.moniker}
            </h1>
            {selectedValidator.jailed && (
              <div className="ml-3 mb-4 flex items-center text-rose-500 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <div>Validator is jailed</div>
              </div>
            )}
            <div className="ml-3 mb-2">
              {selectedValidator?.description.details}
            </div>
            {selectedValidator?.description.website && (
              <div>
                <Button variant="link" asChild className="p-3">
                  <Link
                    href={selectedValidator?.description.website}
                    target="_blank"
                  >
                    <Globe2 className="w-4 h-4 mr-1" />
                    {selectedValidator?.description.website
                      .replace(/^(https?:\/\/)/, "")
                      .replace(/\/$/, "")}
                  </Link>
                </Button>
              </div>
            )}
            {getStakedAmount(selectedValidator.operator_address) && (
              <Card className="shadow-none rounded-2xl border-gray-100">
                <div className="mx-3 my-4 grid grid-cols-2">
                  <div className="text-sm">Staked</div>
                  <div className="text-sm text-right font-semibold">
                    {(
                      parseFloat(
                        getStakedAmount(selectedValidator.operator_address)
                      ) / 1e18
                    )
                      .toFixed(2)
                      .toString()}
                    &nbsp;ZETA
                  </div>
                </div>
                <div className="p-2">
                  {!["withdraw", "redelegate"].includes(pageState) && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={changePageState("withdraw")}
                        variant="outline"
                        className="rounded-lg"
                      >
                        Withdraw
                      </Button>
                      <Button
                        onClick={changePageState("redelegate")}
                        variant="outline"
                        className="rounded-lg"
                      >
                        Redelegate
                      </Button>
                    </div>
                  )}
                  {pageState === "withdraw" && (
                    <div className="grid gap-2 grid-cols-4">
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          min="0"
                          className="text-xl rounded-lg"
                        />
                      </div>
                      <div className="flex col-span-2 gap-0.5">
                        <Button className="grow rounded-r-none">
                          Withdraw
                        </Button>
                        <Button
                          onClick={changePageState("")}
                          className="rounded-l-none bg-gray-950"
                          size="icon"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {pageState === "redelegate" && (
                    <div className="grid gap-2 grid-cols-4">
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={redelegateAmount}
                          onChange={(e) => setRedelegateAmount(e.target.value)}
                          min="0"
                          className="text-xl rounded-lg"
                        />
                      </div>
                      <div className="flex col-span-2 gap-0.5">
                        <Button className="grow rounded-r-none">
                          Redelegate
                        </Button>
                        <Button
                          onClick={changePageState("")}
                          className="rounded-l-none bg-gray-950"
                          size="icon"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
            <div className="mx-3 my-4 grid grid-cols-2">
              <div className="text-sm">Commission</div>
              <div className="text-sm text-right font-semibold">
                {selectedValidator.commission.commission_rates.rate * 100}%
              </div>
            </div>
            {pageState !== "stake" && (
              <div className="mx-3">
                <Button
                  className="w-full mb-1"
                  variant="outline"
                  onClick={changePageState("stake")}
                >
                  Stake
                </Button>
                <div className="text-xs text-slate-400">
                  Available: {parseFloat(zetaBalance).toFixed(4)} ZETA
                </div>
              </div>
            )}
            {pageState === "stake" && (
              <div className="mx-3 grid gap-2 grid-cols-4">
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    min="0"
                    className="text-xl mb-1 rounded-lg"
                    disabled={isSending || !isZetaChain}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <div className="text-xs text-slate-400">
                    Available: {parseFloat(zetaBalance).toFixed(4)} ZETA
                  </div>
                </div>
                <div className="flex col-span-2 gap-0.5">
                  <Button
                    disabled={isSending || !isZetaChain}
                    className="col-span-1 rounded-l-lg rounded-r-none grow"
                    onClick={handleStake}
                  >
                    Stake
                  </Button>
                  <Button
                    onClick={changePageState("")}
                    className="rounded-l-none bg-gray-950"
                    size="icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StakingPage
