export interface TokenSelected {
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

export interface DestinationTokenSelected {
  chain_name: string
  chain_id: string
  coin_type: string
  contract: string
  zrc20: string
}

export interface CrossChainFee {
  amount: string
  decimals: number
  symbol: string
  formatted: string
}

export interface Balance {
  id: string
  contract: string
}

export interface Inbound {
  inboundHash: string
  desc: string
}

export interface Token {
  symbol: string
  chain_name: string
  coin_type: string
  ticker: string
  zrc20?: string
  contract?: string
}
