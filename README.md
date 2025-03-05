# Feather Service

A comprehensive web application for creating, managing, and executing AI agents and pipelines. Built with TypeScript, Express, and Node.js, the service provides both a programmatic API and a user-friendly web interface.

![Feather Logo](https://github.com/user-attachments/assets/be78639b-6c4b-4143-bff1-b246ec0f70f6)

## Features

- **Agent Management**: Create and manage AI agent templates with customizable configurations
- **Pipeline Creation**: Build multi-step pipelines that connect agents for complex workflows
- **Execution Engine**: Run agents and pipelines with custom inputs
- **Robust Function Tools**: Define custom tool functions for agents with auto-execution
- **Structured Output**: Configure agents to return structured JSON data
- **Execution History**: Track the history and results of all runs
- **Web Interface**: Intuitive UI for managing your agent ecosystem
- **Comprehensive API**: RESTful endpoints for programmatic access

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/feather-service.git
cd feather-service
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access the web interface at `http://localhost:3000`

## Usage

### Web Interface

The web interface provides:

- Dashboard with overview of agents, pipelines, and recent runs
- Agent creation and management
- Pipeline design and configuration
- Run history and detailed execution logs
- Interactive testing of agents and pipelines

### API Endpoints

#### Agents

- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get a specific agent by ID
- `POST /api/agents` - Create a new agent
- `PUT /api/agents/:id` - Update an existing agent
- `DELETE /api/agents/:id` - Delete an agent
- `POST /api/agents/:id/run` - Execute an agent with provided input
- `GET /api/agents/:id/runs` - Get all runs for a specific agent

#### Pipelines

- `GET /api/pipelines` - List all pipelines
- `GET /api/pipelines/:id` - Get a specific pipeline by ID
- `POST /api/pipelines` - Create a new pipeline
- `PUT /api/pipelines/:id` - Update an existing pipeline
- `DELETE /api/pipelines/:id` - Delete a pipeline
- `POST /api/pipelines/:id/run` - Execute a pipeline with provided input
- `GET /api/pipelines/runs/:runId` - Get details of a specific run
- `GET /api/pipelines/:id/runs` - Get all runs for a specific pipeline

## Advanced Features

### Function Tools

Feather Service allows you to define custom function tools for your agents:

```javascript
// Example tool definition
{
  "type": "function",
  "function": {
    "name": "search_web",
    "description": "Search the web for information",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "The search query"
        }
      },
      "required": ["query"]
    }
  },
  "implementation": "async function execute(args) { 
    // Your implementation here 
    return { result: `Results for ${args.query}: Sample data` }; 
  }"
}
```

### Structured Output

Configure agents to return structured JSON data:

```javascript
// Example structured output schema
{
  "name": "weather_response",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "temperature": {
        "type": "number",
        "description": "The temperature in Celsius"
      },
      "conditions": {
        "type": "string",
        "description": "Weather conditions description"
      }
    },
    "required": ["temperature", "conditions"]
  }
}
```

### Pipelines

Connect multiple agents together to create complex workflows:

```javascript
// Example pipeline definition
{
  "name": "Research and Summarize",
  "description": "Searches for information and then summarizes it",
  "steps": [
    {
      "agentId": "search-agent-id",
      "inputTemplate": "{{input}}"
    },
    {
      "agentId": "summary-agent-id",
      "inputTemplate": "Summarize this information: {{step0.output}}"
    }
  ]
}
```

## Documentation

For more detailed documentation, see the following:

- [Feather Service Overview](./docs/feather-service.md)
- [Feather Framework Documentation](./docs/feather.md)
- [API Reference](./docs/api-reference.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.