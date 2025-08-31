#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { ZerodhaClient } from './zerodha-client.js';
import { getValidAccessToken } from './auth.js';
import { zerodhaTools } from './tools/zerodha-tools.js';
import type { ZerodhaConfig } from './types/zerodha.js';

// Load environment variables
dotenv.config();

class ZerodhaMCPServer {
  private server: Server;
  private zerodhaClient: ZerodhaClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-z',
        version: '1.0.0',
        description: 'Zerodha MCP Server - Model Context Protocol server for Zerodha trading platform',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    // Note: initializeZerodhaClient() will be called in run() method
  }

  private async initializeZerodhaClient(): Promise<void> {
    const apiKey = process.env.ZERODHA_API_KEY;
    const apiSecret = process.env.ZERODHA_API_SECRET;
    const existingAccessToken = process.env.ZERODHA_ACCESS_TOKEN;
    
    if (!apiKey || !apiSecret) {
      console.error('❌ Missing required Zerodha configuration. Please set ZERODHA_API_KEY and ZERODHA_API_SECRET in your environment variables.');
      process.exit(1);
    }

    try {
      console.log('🚀 Initializing Zerodha MCP Server...');
      
      // Get valid access token (validates existing or generates new one)
      const accessToken = await getValidAccessToken(apiKey, apiSecret, existingAccessToken);
      
      const config: ZerodhaConfig = {
        apiKey,
        apiSecret,
        accessToken,
        baseUrl: process.env.ZERODHA_BASE_URL,
        timeout: process.env.REQUEST_TIMEOUT ? parseInt(process.env.REQUEST_TIMEOUT) : undefined,
      };

      this.zerodhaClient = new ZerodhaClient(config);
      
      // Test the connection
      console.log('🔍 Testing Zerodha API connection...');
      const profile = await this.zerodhaClient.getProfile();
      console.log(`✅ Successfully connected to Zerodha API`);
      console.log(`👤 User: ${profile.user_name} (${profile.email})`);
      console.log(`🏢 Broker: ${profile.broker}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Zerodha client:', error);
      process.exit(1);
    }
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: zerodhaTools,
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.zerodhaClient) {
        throw new Error('Zerodha client not initialized. Please check your configuration.');
      }

      const { name, arguments: args } = request.params;

      try {
        return await this.executeToolHandler(name, args);
      } catch (error) {
        throw new Error(`Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private formatResponse(data: any) {
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }

  private validateOrderIdParam(args: any): void {
    if (!args?.order_id) {
      throw new Error('order_id parameter is required');
    }
  }

  private async executeToolHandler(name: string, args: any): Promise<any> {
    const client = this.zerodhaClient!;
    
    const handlers: Record<string, (args: any) => Promise<any>> = {
      'get_profile': () => client.getProfile(),
      'get_margins': () => client.getMargins(),
      'get_instruments': (args) => client.getInstruments(args?.exchange ? String(args.exchange) : undefined),
      'get_positions': () => client.getPositions(),
      'get_holdings': () => client.getHoldings(),
      'get_orders': () => client.getOrders(),
      'get_order_history': (args) => this.handleOrderIdBasedTool(args, (orderId) => client.getOrderHistory(orderId)),
      'place_order': (args) => this.handlePlaceOrder(args, client),
      'modify_order': (args) => this.handleModifyOrder(args, client),
      'cancel_order': (args) => this.handleCancelOrder(args, client),
      'get_trades': () => client.getTrades(),
      'get_order_trades': (args) => this.handleOrderIdBasedTool(args, (orderId) => client.getOrderTrades(orderId)),
    };

    const handler = handlers[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return this.formatResponse(await handler(args));
  }

  private async handleOrderIdBasedTool(args: any, operation: (orderId: string) => Promise<any>): Promise<any> {
    this.validateOrderIdParam(args);
    return await operation(String(args.order_id));
  }

  private async handlePlaceOrder(args: any, client: ZerodhaClient): Promise<any> {
    if (!args?.exchange || !args?.tradingsymbol || !args?.transaction_type || 
        !args?.quantity || !args?.product || !args?.order_type) {
      throw new Error('Required parameters: exchange, tradingsymbol, transaction_type, quantity, product, order_type');
    }
    
    const orderData = {
      variety: String(args.variety || 'regular'),
      exchange: String(args.exchange),
      tradingsymbol: String(args.tradingsymbol),
      transaction_type: String(args.transaction_type) as 'BUY' | 'SELL',
      quantity: Number(args.quantity),
      product: String(args.product) as 'CNC' | 'MIS' | 'NRML' | 'CO' | 'BO',
      order_type: String(args.order_type) as 'MARKET' | 'LIMIT' | 'SL' | 'SL-M',
      price: args.price ? Number(args.price) : undefined,
      trigger_price: args.trigger_price ? Number(args.trigger_price) : undefined,
      validity: args.validity ? String(args.validity) as 'DAY' | 'IOC' | 'TTL' : undefined,
      disclosed_quantity: args.disclosed_quantity ? Number(args.disclosed_quantity) : undefined,
      tag: args.tag ? String(args.tag) : undefined,
    };

    return await client.placeOrder(orderData);
  }

  private async handleModifyOrder(args: any, client: ZerodhaClient): Promise<any> {
    this.validateOrderIdParam(args);

    const modifyData = {
      quantity: args.quantity ? Number(args.quantity) : undefined,
      price: args.price ? Number(args.price) : undefined,
      trigger_price: args.trigger_price ? Number(args.trigger_price) : undefined,
      order_type: args.order_type ? String(args.order_type) as 'MARKET' | 'LIMIT' | 'SL' | 'SL-M' : undefined,
      validity: args.validity ? String(args.validity) as 'DAY' | 'IOC' | 'TTL' : undefined,
    };

    return await client.modifyOrder(
      String(args.variety || 'regular'),
      String(args.order_id),
      modifyData
    );
  }

  private async handleCancelOrder(args: any, client: ZerodhaClient): Promise<any> {
    this.validateOrderIdParam(args);
    return await client.cancelOrder(String(args.variety || 'regular'), String(args.order_id));
  }

  async run(): Promise<void> {
    // Initialize Zerodha client with authentication
    await this.initializeZerodhaClient();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🔥 Zerodha MCP Server running on stdio');
  }
}

const server = new ZerodhaMCPServer();
server.run().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
