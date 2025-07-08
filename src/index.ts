import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TOOLS_DEFINITION } from "./tools-definition";

// Define environment interface
interface Env {
  // Environment variables can be added here
  MCP_OBJECT: DurableObjectNamespace;
}

// Define state interface for the bridge functionality
interface State {
  commandCount: number;
  commandQueue: Map<string, Command>;
  frontendConnected: boolean;
  lastFrontendPing: number;
}

interface Command {
  id: string;
  command: string;
  params: any;
  timestamp: number;
  processed: boolean;
  resolve?: (value: any) => void;
  reject?: (reason: any) => void;
}

// Add JSON-RPC types
interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number;
  method?: string;
  params?: any;
}

// Define our Webflow MCP agent with tools
export class WebflowMCP extends McpAgent<Env, State> {
	server = new McpServer({
		name: "webflow-designer-mcp",
		version: "2.0.0",
	});

	initialState: State = {
		commandCount: 0,
		commandQueue: new Map(),
		frontendConnected: false,
		lastFrontendPing: 0,
	};
	
	// SSE connections map
	private sseConnections = new Map<string, ReadableStreamDefaultController<any>>();

	async init() {
		// Add all Webflow tools to the MCP server
		for (const tool of TOOLS_DEFINITION) {
			this.server.tool(
				tool.name,
				tool.description,
				tool.inputSchema.properties,
				async (args: any) => {
					console.log(`Executing tool: ${tool.name}`, args);
					
					// Check if frontend is connected
					const isConnected = this.state?.frontendConnected && 
						(Date.now() - (this.state?.lastFrontendPing || 0) < 60000); // 1 minute timeout
					
					if (!isConnected) {
						return {
							content: [
								{
									type: "text" as const,
									text: JSON.stringify({
										error: "Webflow Designer extension not connected",
										message: `Tool '${tool.name}' requires the Webflow Designer extension to be connected. Please ensure the extension is installed and active in Webflow Designer.`,
										toolName: tool.name,
										args: args,
									}),
								},
							],
						};
					}
					
					// Create command and wait for result
					const commandId = `${Date.now()}-${Math.random()}`;
					const command: Command = {
						id: commandId,
						command: tool.name,
						params: args,
						timestamp: Date.now(),
						processed: false,
					};
					
					// Create a promise that will be resolved when we get the result
					const resultPromise = new Promise((resolve, reject) => {
						command.resolve = resolve;
						command.reject = reject;
						
						// Store command in state
						const queue = this.state?.commandQueue instanceof Map 
							? new Map(this.state.commandQueue) 
							: new Map<string, Command>();
						queue.set(commandId, command);
						this.setState({
							...this.state,
							commandQueue: queue,
							commandCount: (this.state?.commandCount || 0) + 1,
						});
						
						// Set timeout
						setTimeout(() => {
							const currentQueue = this.state?.commandQueue instanceof Map 
								? new Map(this.state.commandQueue) 
								: new Map<string, Command>();
							if (currentQueue.has(commandId)) {
								currentQueue.delete(commandId);
								this.setState({
									...this.state,
									commandQueue: currentQueue,
								});
								reject(new Error(`Command ${tool.name} timed out after 30 seconds`));
							}
						}, 30000);
					});
					
					try {
						const result = await resultPromise;
						return {
							content: [
								{
									type: "text" as const,
									text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
								},
							],
						};
					} catch (error) {
						return {
							content: [
								{
									type: "text" as const,
									text: JSON.stringify({
										error: true,
										message: error instanceof Error ? error.message : 'Tool execution failed',
										toolName: tool.name,
									}),
								},
							],
						};
					}
				}
			);
		}

		// Add resources
		this.server.resource(
			"site-info",
			"webflow://site-info",
			() => {
				const isConnected = this.state?.frontendConnected && 
					(Date.now() - (this.state?.lastFrontendPing || 0) < 60000);
				
				const queueSize = this.state?.commandQueue instanceof Map 
					? this.state.commandQueue.size 
					: 0;
				
				return {
					contents: [
						{
							uri: "webflow://site-info",
							mimeType: "application/json",
							text: JSON.stringify({
								connected: isConnected,
								lastPing: this.state?.lastFrontendPing ? new Date(this.state.lastFrontendPing).toISOString() : "Never",
								commandsExecuted: this.state?.commandCount || 0,
								pendingCommands: queueSize,
							}),
						},
					],
				};
			}
		);

		// Add command queue resource
		this.server.resource(
			"command-queue",
			"webflow://command-queue",
			() => {
				const commandQueue = this.state?.commandQueue instanceof Map 
					? this.state.commandQueue 
					: new Map<string, Command>();
				
				const commands = Array.from(commandQueue.values()).map(cmd => ({
					id: cmd.id,
					command: cmd.command,
					timestamp: new Date(cmd.timestamp).toISOString(),
					processed: cmd.processed,
					age: Date.now() - cmd.timestamp,
				}));
				
				return {
					contents: [
						{
							uri: "webflow://command-queue",
							mimeType: "application/json",
							text: JSON.stringify({
								totalCommands: this.state?.commandCount || 0,
								pendingCommands: commands.filter(c => !c.processed).length,
								queue: commands,
							}),
						},
					],
				};
			}
		);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		
		// Add CORS headers to all responses
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
		};
		
		// Handle CORS preflight
		if (method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}
		
		try {
			// Handle SSE for MCP Inspector
			if (path === '/sse' || path === '/sse/message') {
				// For GET requests, check for SSE indicators
				if (method === 'GET' && (url.searchParams.get('transportType') === 'sse' || 
					request.headers.get('accept') === 'text/event-stream')) {
					
					// For GET requests, return SSE stream
					const encoder = new TextEncoder();
					let controller: ReadableStreamDefaultController<any>;
					const sessionId = url.searchParams.get('sessionId') || 'default';
					
					const stream = new ReadableStream({
						start: (ctrl) => {
							controller = ctrl;
							// Store controller for this session
							this.sseConnections.set(sessionId, controller);
							
							// Send endpoint event first
							const endpointMessage = `event: endpoint\ndata: /sse/message\n\n`;
							controller.enqueue(encoder.encode(endpointMessage));
							
							// Keep connection alive with comments
							const interval = setInterval(() => {
								try {
									// Use SSE comment to keep connection alive
									const keepAlive = `: keepalive ${Date.now()}\n\n`;
									controller.enqueue(encoder.encode(keepAlive));
								} catch (error) {
									clearInterval(interval);
								}
							}, 30000);
							
							// Clean up on close
							request.signal.addEventListener('abort', () => {
								clearInterval(interval);
								this.sseConnections.delete(sessionId);
								controller.close();
							});
						}
					});
					
					return new Response(stream, {
						headers: {
							'Content-Type': 'text/event-stream',
							'Cache-Control': 'no-cache',
							'Connection': 'keep-alive',
							'X-Accel-Buffering': 'no', // Disable Nginx buffering
							...corsHeaders,
						},
					});
				}
				
				// For POST requests to /sse/message, handle tool execution
				if (path === '/sse/message' && method === 'POST') {
					try {
						const body = await request.json() as JsonRpcRequest;
						const sessionId = url.searchParams.get('sessionId') || 'default';
						console.log('SSE message received:', body);
						
						// Get the SSE controller for this session
						const controller = this.sseConnections.get(sessionId);
						if (!controller) {
							return new Response(JSON.stringify({
								jsonrpc: "2.0",
								id: body.id,
								error: {
									code: -32603,
									message: "No SSE connection found for this session"
								}
							}), {
								status: 200,
								headers: {
									'Content-Type': 'application/json',
									...corsHeaders
								}
							});
						}
						
						// Handle initialize request
						if (body.method === 'initialize') {
							const response = {
								jsonrpc: "2.0",
								id: body.id,
								result: {
									protocolVersion: "2024-11-05",
									capabilities: {
										tools: {},
										resources: {
											subscribe: false,
											list: true
										}
									},
									serverInfo: {
										name: "webflow-designer-mcp",
										version: "2.0.0"
									}
								}
							};
							
							// Send response through SSE stream
							const encoder = new TextEncoder();
							const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
							controller.enqueue(encoder.encode(message));
							
							// Return empty response to POST request
							return new Response('', {
								status: 200,
								headers: corsHeaders
							});
						}
						
						// Handle initialized notification (client confirms it's ready)
						if (body.method === 'initialized') {
							// Just acknowledge
							return new Response('', {
								status: 200,
								headers: corsHeaders
							});
						}
						
						// Handle tools/list method
						if (body.method === 'tools/list') {
							const response = {
								jsonrpc: "2.0",
								id: body.id,
								result: {
									tools: TOOLS_DEFINITION.map(tool => ({
										name: tool.name,
										description: tool.description,
										inputSchema: tool.inputSchema
									}))
								}
							};
							
							// Send response through SSE stream
							const encoder = new TextEncoder();
							const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
							controller.enqueue(encoder.encode(message));
							
							return new Response('', {
								status: 200,
								headers: corsHeaders
							});
						}
						
						// Handle resources/list method
						if (body.method === 'resources/list') {
							const response = {
								jsonrpc: "2.0",
								id: body.id,
								result: {
									resources: [
										{
											uri: "webflow://site-info",
											name: "Site Information",
											description: "Current Webflow site information and connection status"
										},
										{
											uri: "webflow://command-queue",
											name: "Command Queue",
											description: "Current command queue status"
										}
									]
								}
							};
							
							// Send response through SSE stream
							const encoder = new TextEncoder();
							const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
							controller.enqueue(encoder.encode(message));
							
							return new Response('', {
								status: 200,
								headers: corsHeaders
							});
						}
						
						// Handle resources/read method
						if (body.method === 'resources/read') {
							const uri = body.params?.uri;
							let response: any;
							
							if (uri === 'webflow://site-info') {
								const isConnected = this.state?.frontendConnected && 
									(Date.now() - (this.state?.lastFrontendPing || 0) < 60000);
								
								const queueSize = this.state?.commandQueue instanceof Map 
									? this.state.commandQueue.size 
									: 0;
								
								response = {
									jsonrpc: "2.0",
									id: body.id,
									result: {
										contents: [{
											uri: "webflow://site-info",
											mimeType: "application/json",
											text: JSON.stringify({
												connected: isConnected,
												lastPing: this.state?.lastFrontendPing ? new Date(this.state.lastFrontendPing).toISOString() : "Never",
												commandsExecuted: this.state?.commandCount || 0,
												pendingCommands: queueSize,
											}, null, 2)
										}]
									}
								};
							} else if (uri === 'webflow://command-queue') {
								const commandQueue = this.state?.commandQueue instanceof Map 
									? this.state.commandQueue 
									: new Map<string, Command>();
								
								const commands = Array.from(commandQueue.values()).map(cmd => ({
									id: cmd.id,
									command: cmd.command,
									timestamp: new Date(cmd.timestamp).toISOString(),
									processed: cmd.processed,
									age: Date.now() - cmd.timestamp,
								}));
								
								response = {
									jsonrpc: "2.0",
									id: body.id,
									result: {
										contents: [{
											uri: "webflow://command-queue",
											mimeType: "application/json",
											text: JSON.stringify({
												totalCommands: this.state?.commandCount || 0,
												pendingCommands: commands.filter(c => !c.processed).length,
												queue: commands,
											}, null, 2)
										}]
									}
								};
							} else {
								response = {
									jsonrpc: "2.0",
									id: body.id,
									error: {
										code: -32602,
										message: `Unknown resource: ${uri}`
									}
								};
							}
							
							// Send response through SSE stream
							const encoder = new TextEncoder();
							const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
							controller.enqueue(encoder.encode(message));
							
							return new Response('', {
								status: 200,
								headers: corsHeaders
							});
						}
						
						// Handle tool execution requests
						if (body.method === 'tools/call') {
							const toolName = body.params?.name;
							const toolArgs = body.params?.arguments || {};
							
							// Execute the tool
							const tool = TOOLS_DEFINITION.find(t => t.name === toolName);
							if (!tool) {
								const response = {
									jsonrpc: "2.0",
									id: body.id,
									error: {
										code: -32601,
										message: `Unknown tool: ${toolName}`
									}
								};
								
								// Send response through SSE stream
								const encoder = new TextEncoder();
								const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
								controller.enqueue(encoder.encode(message));
								
								return new Response('', {
									status: 200,
									headers: corsHeaders
								});
							}
							
							// Check if frontend is connected
							const isConnected = this.state?.frontendConnected && 
								(Date.now() - (this.state?.lastFrontendPing || 0) < 60000);
							
							if (!isConnected) {
								const response = {
									jsonrpc: "2.0",
									id: body.id,
									result: {
										content: [{
											type: "text",
											text: JSON.stringify({
												error: "Webflow Designer extension not connected",
												message: `Tool '${toolName}' requires the Webflow Designer extension to be connected.`,
												toolName: toolName
											})
										}]
									}
								};
								
								// Send response through SSE stream
								const encoder = new TextEncoder();
								const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
								controller.enqueue(encoder.encode(message));
								
								return new Response('', {
									status: 200,
									headers: corsHeaders
								});
							}
							
							// Create command for the frontend
							const commandId = `${Date.now()}-${Math.random()}`;
							const command: Command = {
								id: commandId,
								command: toolName,
								params: toolArgs,
								timestamp: Date.now(),
								processed: false,
							};
							
							// Store command and wait for result
							const resultPromise = new Promise((resolve, reject) => {
								command.resolve = resolve;
								command.reject = reject;
								
								const queue = this.state?.commandQueue instanceof Map 
									? new Map(this.state.commandQueue) 
									: new Map<string, Command>();
								queue.set(commandId, command);
								this.setState({
									...this.state,
									commandQueue: queue,
									commandCount: (this.state?.commandCount || 0) + 1,
								});
								
								setTimeout(() => {
									const currentQueue = this.state?.commandQueue instanceof Map 
										? new Map(this.state.commandQueue) 
										: new Map<string, Command>();
									if (currentQueue.has(commandId)) {
										currentQueue.delete(commandId);
										this.setState({
											...this.state,
											commandQueue: currentQueue,
										});
										reject(new Error(`Command ${toolName} timed out after 30 seconds`));
									}
								}, 30000);
							});
							
							try {
								const result = await resultPromise;
								const response = {
									jsonrpc: "2.0",
									id: body.id,
									result: {
										content: [{
											type: "text",
											text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
										}]
									}
								};
								
								// Send response through SSE stream
								const encoder = new TextEncoder();
								const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
								controller.enqueue(encoder.encode(message));
							} catch (error) {
								const response = {
									jsonrpc: "2.0",
									id: body.id,
									result: {
										content: [{
											type: "text",
											text: JSON.stringify({
												error: true,
												message: error instanceof Error ? error.message : 'Tool execution failed',
												toolName: toolName
											})
										}]
									}
								};
								
								// Send response through SSE stream
								const encoder = new TextEncoder();
								const message = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
								controller.enqueue(encoder.encode(message));
							}
							
							return new Response('', {
								status: 200,
								headers: corsHeaders
							});
						}
						
						// Handle other methods - return empty response
						return new Response('', {
							status: 200,
							headers: corsHeaders
						});
					} catch (error) {
						console.error('Error parsing SSE message:', error);
						return new Response(JSON.stringify({
							jsonrpc: "2.0",
							error: {
								code: -32700,
								message: "Parse error"
							}
						}), {
							status: 200,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}
				}
				
				// If we reach here, it's an SSE path but not a valid request
				return new Response('Bad Request', {
					status: 400,
					headers: corsHeaders
				});
			}
			
			// Handle bridge endpoints first
			if (path === '/mcp/bridge/events' && method === 'GET') {
				return this.handleBridgeEvents(corsHeaders);
			}
			
			if (path === '/mcp/command-result' && method === 'POST') {
				return this.handleCommandResult(request, corsHeaders);
			}
			
			// For WebSocket MCP connections, delegate to parent McpAgent
			if (request.headers.get('upgrade') === 'websocket') {
				// Let the parent McpAgent handle the connection
				const response = await super.fetch(request);
				
				// Validate status code
				const status = response.status || 200;
				const validStatus = status >= 200 && status <= 599 ? status : 200;
				
				// Add CORS headers to the response
				const newHeaders = new Headers(response.headers);
				Object.entries(corsHeaders).forEach(([key, value]) => {
					newHeaders.set(key, value);
				});
				
				return new Response(response.body, {
					status: validStatus,
					statusText: response.statusText || 'OK',
					headers: newHeaders,
				});
			}
			
			// Handle status endpoint
			if (path === '/status') {
				const isConnected = this.state?.frontendConnected && 
					(Date.now() - (this.state?.lastFrontendPing || 0) < 60000);
				
				const queueLength = this.state?.commandQueue instanceof Map 
					? this.state.commandQueue.size 
					: 0;
				
				return new Response(JSON.stringify({
					agent: 'webflow-mcp-agent',
					frontendConnected: isConnected,
					lastFrontendPing: this.state?.lastFrontendPing ? new Date(this.state.lastFrontendPing).toISOString() : "Never",
					commandsExecuted: this.state?.commandCount || 0,
					queueLength: queueLength,
					timestamp: new Date().toISOString(),
					stateExists: !!this.state,
				}), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				});
			}
			
			// Default: return 404 for unknown paths
			return new Response('Not Found', { 
				status: 404, 
				headers: corsHeaders 
			});
		} catch (error) {
			console.error('Request error:', error);
			return new Response(JSON.stringify({
				error: error instanceof Error ? error.message : 'Internal server error'
			}), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}
	}
	
	private async handleBridgeEvents(corsHeaders: Record<string, string>): Promise<Response> {
		// Update frontend connection status
		this.setState({
			...(this.state || this.initialState),
			frontendConnected: true,
			lastFrontendPing: Date.now(),
		});
		
		// Ensure commandQueue is a Map
		const commandQueue = this.state?.commandQueue instanceof Map 
			? this.state.commandQueue 
			: new Map<string, Command>();
		
		// Get pending commands
		const pendingCommands = Array.from(commandQueue.values())
			.filter(cmd => !cmd.processed);
		
		if (pendingCommands.length > 0) {
			// Return the oldest pending command
			const command = pendingCommands[0];
			
			// Mark as processed
			const storedCommand = commandQueue.get(command.id);
			if (storedCommand) {
				storedCommand.processed = true;
				this.setState({
					...this.state,
					commandQueue: commandQueue,
				});
			}
			
			// Return command to frontend
			return new Response(JSON.stringify({
				id: command.id,
				command: command.command,
				params: command.params,
			}), {
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			});
		}
		
		// No commands pending - return heartbeat
		return new Response(JSON.stringify({ 
			type: 'heartbeat',
			timestamp: new Date().toISOString() 
		}), {
			headers: {
				'Content-Type': 'application/json',
				...corsHeaders,
			},
		});
	}
	
	private async handleCommandResult(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
		try {
			const body = await request.json() as { id: string; payload: any };
			const { id, payload } = body;
			
			console.log(`Received command result for ${id}:`, payload);
			
			// Ensure commandQueue is a Map
			const commandQueue = this.state?.commandQueue instanceof Map 
				? this.state.commandQueue 
				: new Map<string, Command>();
			
			// Find the command in the queue
			const command = commandQueue.get(id);
			if (command) {
				// Resolve or reject the command promise
				if (payload && typeof payload === 'object' && 'error' in payload) {
					command.reject?.(new Error(payload.error));
				} else {
					command.resolve?.(payload);
				}
				
				// Remove from queue
				commandQueue.delete(id);
				this.setState({
					...this.state,
					commandQueue: commandQueue,
				});
			}
			
			return new Response(JSON.stringify({ success: true }), {
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			});
		} catch (error) {
			console.error('Command result error:', error);
			return new Response(JSON.stringify({ 
				error: error instanceof Error ? error.message : 'Unknown error' 
			}), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			});
		}
	}

	onStateUpdate(state: State) {
		console.log('State updated:', {
			commandCount: state?.commandCount || 0,
			queueLength: state?.commandQueue instanceof Map ? state.commandQueue.size : 0,
			frontendConnected: state?.frontendConnected || false,
		});
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		
		// Add CORS headers to all responses
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
		};
		
		// Handle CORS preflight
		if (method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		// Health check endpoint
		if (url.pathname === '/health') {
			return new Response(JSON.stringify({
				status: 'ok',
				timestamp: new Date().toISOString(),
				service: 'webflow-designer-mcp',
				version: '2.0.0',
			}), {
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			});
		}

		// Info page
		if (url.pathname === '/' && request.method === 'GET' && !url.searchParams.has('transportType')) {
			return new Response(`Webflow MCP Server

This server provides Model Context Protocol tools for controlling Webflow Designer.

Available endpoints:
- /sse - SSE connection for MCP clients  
- /mcp - WebSocket MCP connection
- /mcp/bridge/events - Frontend bridge polling endpoint
- /mcp/command-result - Command result submission
- /status - Server status
- /health - Health check

MCP Connection URL:
- SSE: ${url.origin}/sse

Frontend Bridge URL:
- ${url.origin}/mcp/bridge/events

Tools Available: ${TOOLS_DEFINITION.length} Webflow Designer tools
`, {
				headers: { 
					'Content-Type': 'text/plain',
					...corsHeaders,
				},
			});
		}
		
		// Handle SSE for MCP Inspector
		if ((path === '/sse' || path === '/sse/message') && 
			(url.searchParams.get('transportType') === 'sse' || 
			 request.headers.get('accept') === 'text/event-stream')) {
			
			// Forward all SSE requests to the Durable Object
			const id = env.MCP_OBJECT.idFromName('main');
			const stub = env.MCP_OBJECT.get(id);
			
			// Forward the request to the Durable Object
			return stub.fetch(request);
		}

		// All other requests go to the Durable Object
		// Use a consistent Durable Object ID so all requests go to the same instance
		const id = env.MCP_OBJECT.idFromName('main');
		const stub = env.MCP_OBJECT.get(id);
		
		// Forward the request to the Durable Object
		return stub.fetch(request);
	},
};
