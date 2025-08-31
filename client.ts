import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as readline from 'readline';

interface ToolCategory {
    name: string;
    icon: string;
    tools: {
        name: string;
        description: string;
        parameters?: Record<string, string>;
    }[];
}

class MCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private rl: readline.Interface;
    
    private toolCategories: ToolCategory[] = [
        {
            name: "Account & Profile",
            icon: "👤",
            tools: [
                { name: "get_profile", description: "Get user profile information" },
                { name: "get_margins", description: "Get account margins and fund details" }
            ]
        },
        {
            name: "Portfolio & Holdings",
            icon: "📊",
            tools: [
                { name: "get_positions", description: "Get current trading positions" },
                { name: "get_holdings", description: "Get portfolio holdings" }
            ]
        },
        {
            name: "Instruments",
            icon: "📋",
            tools: [
                { 
                    name: "get_instruments", 
                    description: "List tradable instruments",
                    parameters: { 
                        exchange: "Exchange (NSE, BSE, etc.)",
                        segment: "Segment (EQ, FO, etc.) [optional]"
                    }
                }
            ]
        },
        {
            name: "Orders & Trading",
            icon: "💼",
            tools: [
                { name: "get_orders", description: "Get all orders for the day" },
                { name: "get_order_history", description: "Get order history" },
                { name: "get_trades", description: "Get executed trades" },
                { name: "get_order_trades", description: "Get trades for specific order" },
                { 
                    name: "place_order", 
                    description: "Place a new order",
                    parameters: {
                        variety: "Order variety (regular, amo, etc.)",
                        exchange: "Exchange (NSE, BSE)",
                        tradingsymbol: "Trading symbol",
                        transaction_type: "BUY or SELL",
                        quantity: "Quantity",
                        product: "Product (CNC, MIS, NRML)",
                        order_type: "Order type (MARKET, LIMIT, SL, SL-M)"
                    }
                },
                { 
                    name: "modify_order", 
                    description: "Modify existing order",
                    parameters: {
                        variety: "Order variety",
                        order_id: "Order ID to modify"
                    }
                },
                { 
                    name: "cancel_order", 
                    description: "Cancel an order",
                    parameters: {
                        variety: "Order variety",
                        order_id: "Order ID to cancel"
                    }
                }
            ]
        }
    ];

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async connect() {
        try {
            this.transport = new StdioClientTransport({
                command: "node",
                args: ["./dist/index.js"]
            });

            this.client = new Client({
                name: "zerodha-client",
                version: "1.0.0"
            }, {
                capabilities: {
                    tools: {}
                }
            });

            await this.client.connect(this.transport);
            console.log("✅ Connected to MCP server");
            
            return true;
        } catch (error) {
            console.error("❌ Connection failed:", error);
            throw error;
        }
    }

    async callTool(name: string, args: Record<string, any> = {}) {
        if (!this.client) {
            throw new Error("Client not connected. Call connect() first.");
        }

        try {
            console.log(`\n🔧 Calling tool: ${name}`);
            if (Object.keys(args).length > 0) {
                console.log(`📝 Arguments:`, args);
            }
            
            const result = await this.client.callTool({ name, arguments: args });
            
            console.log(`\n✅ Tool executed successfully!`);
            console.log("📋 Result:");
            
            // Pretty print the result
            if (result.content && result.content[0]?.text) {
                try {
                    const jsonResult = JSON.parse(result.content[0].text);
                    console.log(JSON.stringify(jsonResult, null, 2));
                } catch {
                    console.log(result.content[0].text);
                }
            } else {
                console.log(result);
            }
            
            return result;
        } catch (error) {
            console.error(`❌ Tool call failed:`, error);
            throw error;
        }
    }

    async getUserInput(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    async disconnect() {
        if (this.client && this.transport) {
            await this.client.close();
            await this.transport.close();
            console.log("🔌 Disconnected from MCP server");
        }
        this.rl.close();
    }

    displayMenu() {
        console.clear();
        console.log("╔══════════════════════════════════════╗");
        console.log("║        🏦 Zerodha MCP Client         ║");
        console.log("╚══════════════════════════════════════╝\n");
        
        this.toolCategories.forEach((category, index) => {
            console.log(`${category.icon} ${index + 1}. ${category.name}`);
        });
        
        console.log("\n🔄 0. Refresh Menu");
        console.log("❌ q. Quit\n");
    }

    displayCategoryTools(categoryIndex: number) {
        const category = this.toolCategories[categoryIndex];
        console.clear();
        console.log(`╔══════════════════════════════════════╗`);
        console.log(`║  ${category.icon} ${category.name.padEnd(30)} ║`);
        console.log(`╚══════════════════════════════════════╝\n`);
        
        category.tools.forEach((tool, index) => {
            console.log(`${index + 1}. ${tool.name}`);
            console.log(`   📝 ${tool.description}`);
            if (tool.parameters) {
                console.log(`   📋 Parameters: ${Object.keys(tool.parameters).join(', ')}`);
            }
            console.log();
        });
        
        console.log("🔙 0. Back to main menu");
        console.log("❌ q. Quit\n");
    }

    async getToolParameters(toolName: string, parameters?: Record<string, string>): Promise<Record<string, any>> {
        if (!parameters) return {};
        
        console.log(`\n📝 Enter parameters for ${toolName}:`);
        const args: Record<string, any> = {};
        
        for (const [param, description] of Object.entries(parameters)) {
            const value = await this.getUserInput(`${param} (${description}): `);
            if (value) {
                // Handle comma-separated lists
                if (param === 'instruments' && value.includes(',')) {
                    args[param] = value.split(',').map(s => s.trim());
                } else {
                    args[param] = value;
                }
            }
        }
        
        return args;
    }

    async runInteractiveSession() {
        try {
            await this.connect();
            
            while (true) {
                this.displayMenu();
                const choice = await this.getUserInput("Select a category: ");
                
                if (choice.toLowerCase() === 'q') {
                    break;
                } else if (choice === '0') {
                    continue;
                } else {
                    const categoryIndex = parseInt(choice) - 1;
                    if (categoryIndex >= 0 && categoryIndex < this.toolCategories.length) {
                        await this.handleCategorySelection(categoryIndex);
                    } else {
                        console.log("❌ Invalid choice. Press Enter to continue...");
                        await this.getUserInput("");
                    }
                }
            }
        } catch (error) {
            console.error("❌ Session error:", error);
        } finally {
            await this.disconnect();
            console.log("\n✨ Session ended. Goodbye! 👋");
        }
    }

    async handleCategorySelection(categoryIndex: number) {
        const category = this.toolCategories[categoryIndex];
        
        while (true) {
            this.displayCategoryTools(categoryIndex);
            const choice = await this.getUserInput("Select a tool: ");
            
            if (choice.toLowerCase() === 'q') {
                return;
            } else if (choice === '0') {
                break;
            } else {
                const toolIndex = parseInt(choice) - 1;
                if (toolIndex >= 0 && toolIndex < category.tools.length) {
                    const tool = category.tools[toolIndex];
                    
                    try {
                        const parameters = await this.getToolParameters(tool.name, tool.parameters);
                        await this.callTool(tool.name, parameters);
                        
                        console.log("\n✨ Press Enter to continue...");
                        await this.getUserInput("");
                    } catch (error) {
                        console.error("❌ Error executing tool:", error);
                        console.log("\n❌ Press Enter to continue...");
                        await this.getUserInput("");
                    }
                } else {
                    console.log("❌ Invalid choice. Press Enter to continue...");
                    await this.getUserInput("");
                }
            }
        }
    }
}

// Main execution
async function main() {
    const client = new MCPClient();
    await client.runInteractiveSession();
}

// Run the main function
main().catch(console.error);

export { MCPClient };