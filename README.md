# Webflow MCP Server

This is a Model Context Protocol (MCP) server for controlling Webflow Designer, powered by Cloudflare's agents SDK.

## Features

- **29 Webflow Designer Tools**: Create elements, manage text content, apply CSS classes, work with components, and more
- **Frontend Bridge**: Connects MCP clients (like Cursor) to the Webflow Designer extension
- **Stateful Connections**: Uses Cloudflare Durable Objects for persistent state management
- **Command Queue System**: Handles asynchronous communication between MCP server and frontend
- **CORS-enabled**: Fully configured for browser compatibility

## Available Tools

The server provides 29 tools for Webflow Designer including:

### Element Management
- `create_element` - Create new elements (Sections, DivBlocks, Headings, etc.)
- `get_selected_element` - Get details of currently selected element
- `set_selected_element` - Select an element by ID
- `remove_element` - Remove an element
- `get_all_elements` - List all elements on the page

### Text Content
- `set_text_content` - Set text content of an element
- `get_text_content` - Get text content of an element

### CSS Classes
- `create_semantic_class` - Create new CSS classes with styles
- `apply_semantic_class` - Apply classes to elements
- `update_semantic_class` - Update existing classes
- `list_semantic_classes` - List available classes

### Components & Assets
- `create_component_instance` - Create component instances
- `list_components` - List available components
- `upload_asset` - Upload images and other assets
- `set_image_asset` - Set image sources

And many more...

## Endpoints

- `/sse` - SSE connection for MCP clients
- `/mcp/bridge/events` - Frontend bridge polling endpoint
- `/mcp/command-result` - Command result submission
- `/status` - Server status
- `/health` - Health check

## Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
```

## Usage with Webflow Designer Extension

1. Install the Webflow Designer extension in your browser
2. Open Webflow Designer
3. The extension will automatically connect to this MCP server
4. Use your MCP client (e.g., Cursor) to control Webflow Designer

## Architecture

This server uses Cloudflare's agents SDK with Durable Objects for stateful connections and persistent command queues. The bridge architecture allows asynchronous communication between MCP clients and the Webflow Designer extension. 
