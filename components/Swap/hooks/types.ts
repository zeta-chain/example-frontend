export interface CrossChainFee {
  amount: string
  decimals: number
  symbol: string
  formatted: string
}

export interface Balance {
  id: string
  contract: string
  balance: number
  chain_name: string
}

export interface Inbound {
  inboundHash: string
  desc: string
}

export interface Token {
  balance: string
  coin_type: string
  contract: string
  zrc20: string
  chain_id: number
  symbol: string
  decimals: number
  chain_name: string
  ticker: string
}

export interface Error {
  message: string
  enabled: boolean
  priority: number
}

export interface Errors {
  [key: string]: Error
}
