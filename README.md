# KiteLink (Zerodha)

A Model Context Protocol (MCP) server for Zerodha Kite trading platform integration.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create `.env` file with your API credentials:
   ```env
   ZERODHA_API_KEY=your_api_key
   ZERODHA_API_SECRET=your_api_secret
   # ZERODHA_ACCESS_TOKEN will be generated automatically
   ```

3. **Build and run**:
   ```bash
   npm run build
   npm start
   ```

4. **Run interactive client**:
   ```bash
   npm run client
   ```

5. **First-time authentication**:
   - On first run, the server will guide you through OAuth login
   - It will open a login URL in your browser
   - Complete login and copy the request_token from redirect URL
   - Access token will be automatically generated and saved

## Available Tools

### Account & Profile 👤
- `get_profile` - Get user profile information
- `get_margins` - Get account margins and fund details

### Portfolio & Holdings 📊
- `get_positions` - Get current trading positions
- `get_holdings` - Get portfolio holdings

### Instruments 📋
- `get_instruments` - List tradable instruments for exchanges

### Orders & Trading 💼
- `get_orders` - Get all orders for the day
- `get_order_history` - Get order history
- `get_trades` - Get executed trades
- `get_order_trades` - Get trades for specific order
- `place_order` - Place a new trading order
- `modify_order` - Modify existing order
- `cancel_order` - Cancel an order

## Interactive Client

The project includes an interactive command-line client with categorized menus:

```bash
npm run client
```

Features:
- 📋 Category-wise tool organization
- 🎯 Interactive parameter input
- ✨ Pretty-printed JSON results
- 🔄 Continuous usage until quit

## Usage Examples

### Get Your Profile
```
Select category: 1 (Account & Profile)
Select tool: 1 (get_profile)
```

### Check Positions
```
Select category: 2 (Portfolio & Holdings)  
Select tool: 1 (get_positions)
```

### List NSE Instruments
```
Select category: 3 (Instruments)
Select tool: 1 (get_instruments)
Enter exchange: NSE
Enter segment: EQ
```


## API Credentials

1. Register at [Kite Connect](https://kite.trade/)
2. Create an app to get API key and secret
3. The server will automatically handle the OAuth flow and generate access tokens

## License

MIT License
