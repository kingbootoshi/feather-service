# Feather Service: Agent and Pipeline Management Platform

Feather Service is a comprehensive web application for creating, managing, and executing AI agents and pipelines. Built with TypeScript, Express, and Node.js, the service provides both a programmatic API and a user-friendly web interface for interacting with AI agents.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [API Reference](#api-reference)
5. [Web Interface](#web-interface)
6. [Getting Started](#getting-started)
7. [Development Guide](#development-guide)
8. [Examples](#examples)

## Overview

Feather Service allows you to:

- Create and manage AI agent templates with customizable configurations
- Build multi-step pipelines that connect agents together for complex workflows
- Execute agents and pipelines with custom inputs
- Track the execution history and results of agent/pipeline runs
- Manage your agent ecosystem through both REST APIs and a web interface

The service stores all configurations and execution history in local JSON files, making it easy to deploy and use without external database dependencies.

## Architecture

Feather Service follows a clean Model-View-Controller (MVC) architecture:

```
feather-service/
├── src/
│   ├── models/       # Data models and types
│   ├── controllers/  # Request handlers and business logic
│   ├── routes/       # API and UI route definitions
│   ├── db/           # Database layer (using local JSON files)
│   ├── utils/        # Utility functions and services
│   ├── views/        # HTML templates for web interface
│   └── index.ts      # Application entry point
├── public/           # Static assets (CSS, client-side JS)
├── docs/             # Documentation
└── data/             # Storage for JSON database files
```

## Key Components

### Models

The service is built around several core data models:

#### Agent

An Agent represents a configurable AI agent template with the following properties:

```typescript
interface Agent {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  tools?: Tool[];
  structuredOutputSchema?: any;
  autoExecuteTools?: boolean;
  cognition?: boolean;
  chainRun?: boolean;
  maxChainIterations?: number;
  forceTool?: boolean;
  createdAt: Date;
}
```

#### Pipeline

A Pipeline connects multiple agents together in a sequence of steps:

```typescript
interface Pipeline {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep[];
  outputDestinations?: string[];
  createdAt: Date;
}

interface PipelineStep {
  agentId: string;
  inputTemplate: string;
}
```

#### Run

A Run tracks the execution of an agent or pipeline:

```typescript
interface Run {
  id: string;
  agentId?: string;
  pipelineId?: string;
  input: string;
  outputs: Output[];
  status: "running" | "completed" | "failed";
  finalOutput?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface Output {
  agentId: string;
  output: string;
  timestamp: Date;
}
```

### Services

#### Agent Service

The Agent Service (`/src/utils/agentService.ts`) handles the execution of individual agents:

- It processes the agent configuration
- Sends requests to AI models with appropriate parameters
- Processes and returns the AI responses
- Handles errors and failure cases

#### Pipeline Service

The Pipeline Service (`/src/utils/pipelineService.ts`) orchestrates the execution of pipelines:

- It processes each step in the pipeline sequentially
- Passes outputs from previous steps as inputs to subsequent steps
- Tracks the overall execution status
- Handles failures at any stage of the pipeline

### Database Layer

The database layer (`/src/db/database.ts`) provides an interface for storing and retrieving data:

- Stores agent templates, pipelines, and run history in JSON files
- Provides CRUD operations for all data models
- Handles data validation and error handling
- Implements search and filtering capabilities

## API Reference

### Agent Routes

- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get a specific agent by ID
- `POST /api/agents` - Create a new agent
- `PUT /api/agents/:id` - Update an existing agent
- `DELETE /api/agents/:id` - Delete an agent
- `POST /api/agents/:id/run` - Execute an agent with provided input

### Pipeline Routes

- `GET /api/pipelines` - List all pipelines
- `GET /api/pipelines/:id` - Get a specific pipeline by ID
- `POST /api/pipelines` - Create a new pipeline
- `PUT /api/pipelines/:id` - Update an existing pipeline
- `DELETE /api/pipelines/:id` - Delete a pipeline
- `POST /api/pipelines/:id/run` - Execute a pipeline with provided input
- `GET /api/pipelines/runs/:runId` - Get details of a specific run

### Request/Response Examples

#### Create an Agent

**Request:**
```json
POST /api/agents
{
  "name": "Weather Assistant",
  "model": "openai/gpt-4o",
  "systemPrompt": "You are a helpful assistant that provides weather information.",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "autoExecuteTools": true
}
```

**Response:**
```json
{
  "id": "agent-123",
  "name": "Weather Assistant",
  "model": "openai/gpt-4o",
  "systemPrompt": "You are a helpful assistant that provides weather information.",
  "tools": [...],
  "autoExecuteTools": true,
  "createdAt": "2025-03-05T12:00:00.000Z"
}
```

#### Run an Agent

**Request:**
```json
POST /api/agents/agent-123/run
{
  "input": "What's the weather like in New York today?"
}
```

**Response:**
```json
{
  "runId": "run-456",
  "success": true,
  "output": "The current weather in New York is 72°F and partly cloudy.",
  "error": null
}
```

## Web Interface

The web interface provides a user-friendly way to interact with the service:

- **Home Page** (`/`) - Dashboard with overview of agents, pipelines, and recent runs
- **Agents Page** (`/agents`) - List and manage agent templates
- **Create Agent Page** (`/agents/new`) - Form to create new agent templates
- **Pipelines Page** (`/pipelines`) - List and manage pipelines
- **Create Pipeline Page** (`/pipelines/new`) - Form to create new pipelines
- **Runs Page** (`/runs`) - View execution history and results
- **Run Details Page** (`/runs/:id`) - Detailed view of a specific run

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/feather-service.git
cd feather-service
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Access the web interface at `http://localhost:3000`

### Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_api_key_here
```

## Development Guide

### Project Structure

- `/src`: Source code
  - `/models`: TypeScript interfaces and type definitions
  - `/controllers`: Request handlers and business logic
  - `/routes`: API and UI route definitions
  - `/db`: Database layer using local JSON files
  - `/utils`: Utility functions and services
  - `/views`: HTML templates for the web interface
- `/public`: Static assets (CSS, client-side JS)
- `/docs`: Documentation
- `/data`: Storage for JSON database files

### Adding a New Feature

1. Define any new models or types in `/src/models/types.ts`
2. Implement database operations in `/src/db/database.ts`
3. Add controller methods in the appropriate controller file
4. Define routes in the appropriate route file
5. Create or update views for the web interface
6. Add any necessary utility functions or services

### Testing

Run the tests with:

```bash
npm test
```

## Examples

### Creating and Running a Simple Agent

```typescript
// Create a new agent
const newAgent = {
  name: "Echo Agent",
  model: "openai/gpt-3.5-turbo",
  systemPrompt: "You are an echo agent. You repeat what the user says.",
};

// Call the API to create the agent
const response = await fetch('/api/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newAgent),
});

const agent = await response.json();

// Run the agent
const runResponse = await fetch(`/api/agents/${agent.id}/run`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: "Hello, world!",
  }),
});

const result = await runResponse.json();
console.log(result.output); // Should echo "Hello, world!"
```

### Creating and Running a Pipeline

```typescript
// Assuming we have two agents already created:
// - agent1: A summarization agent
// - agent2: A translation agent

// Create a pipeline that summarizes text and then translates it
const newPipeline = {
  name: "Summarize and Translate",
  description: "First summarizes text, then translates to French",
  steps: [
    {
      agentId: "agent1", // ID of the summarization agent
      inputTemplate: "{{input}}" // Pass the original input
    },
    {
      agentId: "agent2", // ID of the translation agent
      inputTemplate: "Translate this to French: {{step0.output}}" // Use output from previous step
    }
  ]
};

// Call the API to create the pipeline
const response = await fetch('/api/pipelines', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newPipeline),
});

const pipeline = await response.json();

// Run the pipeline
const runResponse = await fetch(`/api/pipelines/${pipeline.id}/run`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: "This is a long article about artificial intelligence...",
  }),
});

const result = await runResponse.json();
console.log(result); // Contains the runId, status, etc.
```

## Conclusion

Feather Service provides a powerful, flexible platform for creating, managing, and executing AI agents and pipelines. With its clean architecture and comprehensive features, it offers both a programmatic API and a user-friendly web interface for working with AI agents in a variety of contexts.

For more information on the underlying agent framework, see [feather.md](./feather.md).