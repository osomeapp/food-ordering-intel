#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { menuHandlers, handleToolCall } from './handlers/menu-handlers.js';

class MenuServer {
  constructor() {
    this.server = new Server(
      {
        name: "mcp-menu-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.values(menuHandlers)
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!menuHandlers[name]) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        console.log(`[MCP] Calling tool: ${name} with args:`, JSON.stringify(args, null, 2));
        
        const result = await handleToolCall(name, args || {});
        
        console.log(`[MCP] Tool ${name} completed successfully`);
        return result;
        
      } catch (error) {
        console.error(`[MCP] Error calling tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Error calling tool ${name}: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("MCP Menu Server running on stdio");
  }
}

const server = new MenuServer();
server.run().catch(console.error);