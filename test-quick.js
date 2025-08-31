import { MCPClient } from "./client.js"; const client = new MCPClient(); client.connect().then(() => client.callTool("get_profile")).then(() => client.disconnect()).catch(console.error);
