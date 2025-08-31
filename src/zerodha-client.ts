import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ZerodhaConfig,
  MarketQuote,
  Instrument,
  Position,
  Holding,
  Order,
  MarginRequired,
  OrderPlacement,
} from './types/zerodha.js';

export class ZerodhaClient {
  private client: AxiosInstance;
  private config: ZerodhaConfig;

  constructor(config: ZerodhaConfig) {
    this.config = {
      baseUrl: 'https://api.kite.trade',
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.config.apiKey}:${this.config.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new Error(
            `Zerodha API Error: ${error.response.status} - ${
              error.response.data?.message || error.response.statusText
            }`
          );
        }
        throw error;
      }
    );
  }

  /**
   * Get user profile information
   */
  async getProfile(): Promise<any> {
    return this.executeWithErrorHandling(
      () => this.client.get('/user/profile'),
      'fetch profile'
    );
  }

  /**
   * Get user margins
   */
  async getMargins(): Promise<MarginRequired> {
    return this.executeWithErrorHandling(
      () => this.client.get('/user/margins'),
      'fetch margins'
    );
  }

  private buildInstrumentsParam(instruments: string[]): string {
    return instruments.map(i => `i=${encodeURIComponent(i)}`).join('&');
  }

  private async executeWithErrorHandling<T>(
    operation: () => Promise<AxiosResponse>, 
    operationName: string
  ): Promise<T> {
    try {
      const response = await operation();
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to ${operationName}: ${error}`);
    }
  }

  /**
   * Get market quotes for given instruments
   */
  async getQuotes(instruments: string[]): Promise<Record<string, MarketQuote>> {
    const instrumentsParam = this.buildInstrumentsParam(instruments);
    return this.executeWithErrorHandling(
      () => this.client.get(`/quote?${instrumentsParam}`),
      'fetch quotes'
    );
  }

  /**
   * Get OHLC data for given instruments
   */
  async getOHLC(instruments: string[]): Promise<Record<string, any>> {
    const instrumentsParam = this.buildInstrumentsParam(instruments);
    return this.executeWithErrorHandling(
      () => this.client.get(`/quote/ohlc?${instrumentsParam}`),
      'fetch OHLC'
    );
  }

  /**
   * Get LTP (Last Traded Price) for given instruments
   */
  async getLTP(instruments: string[]): Promise<Record<string, any>> {
    const instrumentsParam = this.buildInstrumentsParam(instruments);
    return this.executeWithErrorHandling(
      () => this.client.get(`/quote/ltp?${instrumentsParam}`),
      'fetch LTP'
    );
  }

  /**
   * Get historical data for an instrument
   */
  async getHistoricalData(
    instrumentToken: string,
    interval: string,
    fromDate: string,
    toDate: string,
    continuous?: boolean,
    oi?: boolean
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        interval,
        from: fromDate,
        to: toDate,
        ...(continuous && { continuous: '1' }),
        ...(oi && { oi: '1' }),
      });

      const response: AxiosResponse = await this.client.get(
        `/instruments/historical/${instrumentToken}?${params}`
      );
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch historical data: ${error}`);
    }
  }

  private parseInstrumentValue(key: string, value: string): any {
    const numericFields = ['instrument_token', 'exchange_token', 'last_price', 'strike', 'tick_size', 'lot_size'];
    return numericFields.includes(key) ? parseFloat(value) || 0 : value;
  }

  private parseCsvToInstruments(csvData: string): Instrument[] {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map((line: string) => {
      const values = line.split(',');
      const instrument: any = {};
      headers.forEach((header: string, index: number) => {
        const key = header.trim();
        const rawValue = values[index]?.trim() || '';
        instrument[key] = this.parseInstrumentValue(key, rawValue);
      });
      return instrument as Instrument;
    });
  }

  /**
   * Get all instruments
   */
  async getInstruments(exchange?: string): Promise<Instrument[]> {
    try {
      const url = exchange ? `/instruments/${exchange}` : '/instruments';
      const response: AxiosResponse = await this.client.get(url);
      return this.parseCsvToInstruments(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch instruments: ${error}`);
    }
  }

  /**
   * Get user positions
   */
  async getPositions(): Promise<{ net: Position[], day: Position[] }> {
    return this.executeWithErrorHandling(
      () => this.client.get('/portfolio/positions'),
      'fetch positions'
    );
  }

  /**
   * Get user holdings
   */
  async getHoldings(): Promise<Holding[]> {
    return this.executeWithErrorHandling(
      () => this.client.get('/portfolio/holdings'),
      'fetch holdings'
    );
  }

  /**
   * Get all orders
   */
  async getOrders(): Promise<Order[]> {
    return this.executeWithErrorHandling(
      () => this.client.get('/orders'),
      'fetch orders'
    );
  }

  /**
   * Get order history for a specific order
   */
  async getOrderHistory(orderId: string): Promise<Order[]> {
    try {
      const response: AxiosResponse = await this.client.get(`/orders/${orderId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch order history: ${error}`);
    }
  }

  /**
   * Place a new order
   */
  async placeOrder(orderData: OrderPlacement): Promise<{ order_id: string }> {
    try {
      const formData = new URLSearchParams();
      Object.entries(orderData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response: AxiosResponse = await this.client.post('/orders/regular', formData);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to place order: ${error}`);
    }
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(
    variety: string,
    orderId: string,
    orderData: Partial<OrderPlacement>
  ): Promise<{ order_id: string }> {
    try {
      const formData = new URLSearchParams();
      Object.entries(orderData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response: AxiosResponse = await this.client.put(`/orders/${variety}/${orderId}`, formData);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to modify order: ${error}`);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(variety: string, orderId: string): Promise<{ order_id: string }> {
    try {
      const response: AxiosResponse = await this.client.delete(`/orders/${variety}/${orderId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error}`);
    }
  }

  /**
   * Get trades
   */
  async getTrades(): Promise<any[]> {
    return this.executeWithErrorHandling(
      () => this.client.get('/trades'),
      'fetch trades'
    );
  }

  /**
   * Get trades for a specific order
   */
  async getOrderTrades(orderId: string): Promise<any[]> {
    try {
      const response: AxiosResponse = await this.client.get(`/orders/${orderId}/trades`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch order trades: ${error}`);
    }
  }
}
