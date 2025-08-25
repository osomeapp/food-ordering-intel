#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { handleToolCall, menuHandlers } from './handlers/menu-handlers.js';

class MenuHTTPServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[HTTP] ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // List available tools
    this.app.get('/api/mcp/tools', (req, res) => {
      const tools = Object.values(menuHandlers);
      console.log('[HTTP] Returning tools:', tools.map(t => t.name));
      res.json({ tools });
    });

    // Call a tool
    this.app.post('/api/mcp/call', async (req, res) => {
      try {
        const { tool, arguments: args } = req.body;
        
        if (!tool) {
          return res.status(400).json({ error: 'Tool name is required' });
        }

        if (!menuHandlers[tool]) {
          return res.status(404).json({ error: `Unknown tool: ${tool}` });
        }

        console.log(`[HTTP] Calling tool: ${tool} with args:`, args);
        
        const mcpResult = await handleToolCall(tool, args || {});
        
        console.log(`[HTTP] Tool ${tool} completed successfully`);
        
        // Extract the actual data from MCP format
        const actualData = JSON.parse(mcpResult.content[0].text);
        
        // Return result directly (the frontend expects the actual data, not MCP format)
        res.json(actualData);
        
      } catch (error) {
        console.error(`[HTTP] Error calling tool:`, error);
        res.status(500).json({ error: error.message });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      console.log(`[HTTP] 404 - Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Route not found' });
    });
  }

  setupErrorHandling() {
    this.app.use((error, req, res, next) => {
      console.error('[HTTP] Unhandled error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    process.on('SIGINT', () => {
      console.log('\n[HTTP] Shutting down server...');
      process.exit(0);
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`[HTTP] Menu Server running on http://localhost:${this.port}`);
      console.log(`[HTTP] Available endpoints:`);
      console.log(`  GET  /health - Health check`);
      console.log(`  GET  /api/mcp/tools - List available tools`);
      console.log(`  POST /api/mcp/call - Call a tool`);
    });
  }
}

const server = new MenuHTTPServer();
server.start();