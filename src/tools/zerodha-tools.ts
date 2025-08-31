import { Tool } from '@modelcontextprotocol/sdk/types.js';

const getProfileTool: Tool = {
  name: 'get_profile',
  description: 'Get user profile information including user details, broker, and account info',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const getMarginsTool: Tool = {
  name: 'get_margins',
  description: 'Get user margin information for equity and commodity segments',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};


const getInstrumentsTool: Tool = {
  name: 'get_instruments',
  description: 'Get list of all tradable instruments or instruments for a specific exchange',
  inputSchema: {
    type: 'object',
    properties: {
      exchange: {
        type: 'string',
        enum: ['NSE', 'BSE', 'NFO', 'BFO', 'CDS', 'MCX'],
        description: 'Exchange name (optional). If not provided, returns all instruments',
      },
    },
    required: [],
  },
};

const getPositionsTool: Tool = {
  name: 'get_positions',
  description: 'Get current trading positions (both day and net positions)',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const getHoldingsTool: Tool = {
  name: 'get_holdings',
  description: 'Get long term holdings in the portfolio',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const getOrdersTool: Tool = {
  name: 'get_orders',
  description: 'Get list of all orders placed today',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const getOrderHistoryTool: Tool = {
  name: 'get_order_history',
  description: 'Get complete history of a specific order including all modifications',
  inputSchema: {
    type: 'object',
    properties: {
      order_id: {
        type: 'string',
        description: 'Order ID to get history for',
      },
    },
    required: ['order_id'],
  },
};

const placeOrderTool: Tool = {
  name: 'place_order',
  description: 'Place a new trading order',
  inputSchema: {
    type: 'object',
    properties: {
      variety: {
        type: 'string',
        enum: ['regular', 'co', 'bo', 'amo'],
        description: 'Order variety',
        default: 'regular',
      },
      exchange: {
        type: 'string',
        enum: ['NSE', 'BSE', 'NFO', 'BFO', 'CDS', 'MCX'],
        description: 'Exchange name',
      },
      tradingsymbol: {
        type: 'string',
        description: 'Trading symbol (e.g., INFY, NIFTY24JAN20000CE)',
      },
      transaction_type: {
        type: 'string',
        enum: ['BUY', 'SELL'],
        description: 'Transaction type',
      },
      quantity: {
        type: 'integer',
        minimum: 1,
        description: 'Number of shares/contracts to trade',
      },
      product: {
        type: 'string',
        enum: ['CNC', 'MIS', 'NRML', 'CO', 'BO'],
        description: 'Product type (CNC=Cash and Carry, MIS=Margin Intraday Squareoff, NRML=Normal)',
      },
      order_type: {
        type: 'string',
        enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
        description: 'Order type',
      },
      price: {
        type: 'number',
        minimum: 0,
        description: 'Limit price (required for LIMIT and SL orders)',
      },
      trigger_price: {
        type: 'number',
        minimum: 0,
        description: 'Trigger price (required for SL and SL-M orders)',
      },
      validity: {
        type: 'string',
        enum: ['DAY', 'IOC', 'TTL'],
        description: 'Order validity',
        default: 'DAY',
      },
      disclosed_quantity: {
        type: 'integer',
        minimum: 0,
        description: 'Disclosed quantity for iceberg orders',
      },
      tag: {
        type: 'string',
        maxLength: 20,
        description: 'Custom tag for order identification',
      },
    },
    required: ['exchange', 'tradingsymbol', 'transaction_type', 'quantity', 'product', 'order_type'],
  },
};

const modifyOrderTool: Tool = {
  name: 'modify_order',
  description: 'Modify an existing order',
  inputSchema: {
    type: 'object',
    properties: {
      variety: {
        type: 'string',
        enum: ['regular', 'co', 'bo', 'amo'],
        description: 'Order variety',
        default: 'regular',
      },
      order_id: {
        type: 'string',
        description: 'Order ID to modify',
      },
      quantity: {
        type: 'integer',
        minimum: 1,
        description: 'New quantity',
      },
      price: {
        type: 'number',
        minimum: 0,
        description: 'New limit price',
      },
      trigger_price: {
        type: 'number',
        minimum: 0,
        description: 'New trigger price',
      },
      order_type: {
        type: 'string',
        enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
        description: 'New order type',
      },
      validity: {
        type: 'string',
        enum: ['DAY', 'IOC', 'TTL'],
        description: 'New validity',
      },
    },
    required: ['order_id'],
  },
};

const cancelOrderTool: Tool = {
  name: 'cancel_order',
  description: 'Cancel an existing order',
  inputSchema: {
    type: 'object',
    properties: {
      variety: {
        type: 'string',
        enum: ['regular', 'co', 'bo', 'amo'],
        description: 'Order variety',
        default: 'regular',
      },
      order_id: {
        type: 'string',
        description: 'Order ID to cancel',
      },
    },
    required: ['order_id'],
  },
};

const getTradesTool: Tool = {
  name: 'get_trades',
  description: 'Get list of all executed trades for the day',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const getOrderTradesTool: Tool = {
  name: 'get_order_trades',
  description: 'Get all trades executed for a specific order',
  inputSchema: {
    type: 'object',
    properties: {
      order_id: {
        type: 'string',
        description: 'Order ID to get trades for',
      },
    },
    required: ['order_id'],
  },
};

// Export all tools as an array
export const zerodhaTools = [
  getProfileTool,
  getMarginsTool,
  getInstrumentsTool,
  getPositionsTool,
  getHoldingsTool,
  getOrdersTool,
  getOrderHistoryTool,
  placeOrderTool,
  modifyOrderTool,
  cancelOrderTool,
  getTradesTool,
  getOrderTradesTool,
];
