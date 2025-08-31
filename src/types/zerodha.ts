export interface ZerodhaConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  baseUrl?: string;
  timeout?: number;
}

export interface MarketQuote {
  instrument_token: number;
  last_price: number;
  last_quantity: number;
  average_price: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  net_change: number;
  oi?: number;
  oi_day_high?: number;
  oi_day_low?: number;
  timestamp: string;
  depth: {
    buy: OrderBookEntry[];
    sell: OrderBookEntry[];
  };
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface Instrument {
  instrument_token: number;
  exchange_token: number;
  tradingsymbol: string;
  name: string;
  last_price: number;
  expiry?: string;
  strike?: number;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
  segment: string;
  exchange: string;
}

export interface Position {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: string;
  quantity: number;
  overnight_quantity: number;
  multiplier: number;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
  buy_quantity: number;
  buy_price: number;
  buy_value: number;
  buy_m2m: number;
  sell_quantity: number;
  sell_price: number;
  sell_value: number;
  sell_m2m: number;
  day_buy_quantity: number;
  day_buy_price: number;
  day_buy_value: number;
  day_sell_quantity: number;
  day_sell_price: number;
  day_sell_value: number;
}

export interface Holding {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  isin: string;
  product: string;
  price: number;
  quantity: number;
  used_quantity: number;
  t1_quantity: number;
  realised_quantity: number;
  authorised_quantity: number;
  authorised_date?: string;
  opening_quantity: number;
  collateral_quantity: number;
  collateral_type?: string;
  discrepancy: boolean;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface Order {
  account_id: string;
  placed_by: string;
  order_id: string;
  exchange_order_id?: string;
  parent_order_id?: string;
  status: string;
  status_message?: string;
  status_message_raw?: string;
  order_timestamp: string;
  exchange_update_timestamp?: string;
  exchange_timestamp?: string;
  variety: string;
  exchange: string;
  tradingsymbol: string;
  instrument_token: number;
  order_type: string;
  transaction_type: string;
  validity: string;
  product: string;
  quantity: number;
  disclosed_quantity: number;
  price: number;
  trigger_price: number;
  average_price: number;
  filled_quantity: number;
  pending_quantity: number;
  cancelled_quantity: number;
  market_protection: number;
  meta: Record<string, any>;
  tag?: string;
  guid: string;
}

export interface MarginRequired {
  equity: {
    enabled: boolean;
    net: number;
    available: {
      adhoc_margin: number;
      cash: number;
      opening_balance: number;
      live_balance: number;
      collateral: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
      liquid_collateral: number;
      stock_collateral: number;
    };
  };
  commodity: {
    enabled: boolean;
    net: number;
    available: {
      adhoc_margin: number;
      cash: number;
      opening_balance: number;
      live_balance: number;
    };
    utilised: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
      liquid_collateral: number;
      stock_collateral: number;
    };
  };
}

export interface OrderPlacement {
  variety: string;
  exchange: string;
  tradingsymbol: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  product: 'CNC' | 'MIS' | 'NRML' | 'CO' | 'BO';
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  price?: number;
  trigger_price?: number;
  validity?: 'DAY' | 'IOC' | 'TTL';
  disclosed_quantity?: number;
  tag?: string;
}
