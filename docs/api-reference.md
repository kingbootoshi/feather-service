# Feather Service API Reference

This document provides a comprehensive reference for all API endpoints in the Feather Service.

## Table of Contents

1. [Authentication](#authentication)
2. [Agent Endpoints](#agent-endpoints)
3. [Pipeline Endpoints](#pipeline-endpoints)
4. [Run Endpoints](#run-endpoints)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)

## Authentication

Currently, the API does not require authentication. This may change in future versions.

## Agent Endpoints

### List All Agents

Retrieves a list of all available agents.

**Endpoint:** `GET /api/agents`

**Query Parameters:**
- None

**Response:**
```json
[
  {
    "id": "agent-123",
    "name": "Weather Assistant",
    "model": "openai/gpt-4o",
    "systemPrompt": "You are a helpful assistant that provides weather information.",
    "tools": [...],
    "createdAt": "2025-03-05T12:00:00.000Z",
    "autoExecuteTools": true,
    "cognition": false,
    "chainRun": false,
    "maxChainIterations": 5,
    "forceTool": false,
    "structuredOutputSchema": null
  },
  {...}
]
```

### Get Agent by ID

Retrieves a specific agent by its ID.

**Endpoint:** `GET /api/agents/:id`

**URL Parameters:**
- `id` - The ID of the agent to retrieve

**Query Parameters:**
- `includeLatestRun` (boolean, optional) - When set to 'true', includes details of the most recent run for this agent

**Response (without latest run):**
```json
{
  "id": "agent-123",
  "name": "Weather Assistant",
  "model": "openai/gpt-4o",
  "systemPrompt": "You are a helpful assistant that provides weather information.",
  "tools": [...],
  "createdAt": "2025-03-05T12:00:00.000Z",
  "autoExecuteTools": true,
  "cognition": false,
  "chainRun": false,
  "maxChainIterations": 5,
  "forceTool": false,
  "structuredOutputSchema": null
}
```

**Response (with latest run):**
```json
{
  "id": "agent-123",
  "name": "Weather Assistant",
  "model": "openai/gpt-4o",
  "systemPrompt": "You are a helpful assistant that provides weather information.",
  "tools": [...],
  "createdAt": "2025-03-05T12:00:00.000Z",
  "autoExecuteTools": true,
  "cognition": false,
  "chainRun": false,
  "maxChainIterations": 5,
  "forceTool": false,
  "structuredOutputSchema": null,
  "latestRun": {
    "id": "run-456",
    "status": "completed",
    "createdAt": "2025-03-05T14:30:00.000Z",
    "completedAt": "2025-03-05T14:30:05.000Z",
    "input": "What's the weather like in New York?",
    "finalOutput": "The current weather in New York is 72°F and partly cloudy.",
    "error": null
  }
}
```

### Create Agent

Creates a new agent with the provided configuration.

**Endpoint:** `POST /api/agents`

**Request Body:**
```json
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
      },
      "implementation": "async function execute(args) {\n  console.log('Getting weather for', args.location);\n  return { result: `The weather in ${args.location} is sunny and 75°F.` };\n}"
    }
  ],
  "autoExecuteTools": true,
  "cognition": false,
  "chainRun": false,
  "maxChainIterations": 5,
  "forceTool": false,
  "additionalParams": {
    "temperature": 0.7
  }
}
```

Or with structured output:

```json
{
  "name": "Weather Data Provider",
  "model": "openai/gpt-4o",
  "systemPrompt": "You provide structured weather data for locations.",
  "structuredOutputSchema": {
    "name": "weather_response",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "temperature": {
          "type": "number",
          "description": "Temperature in Celsius"
        },
        "conditions": {
          "type": "string",
          "description": "Weather conditions"
        },
        "humidity": {
          "type": "number",
          "description": "Humidity percentage"
        }
      },
      "required": ["temperature", "conditions"]
    }
  },
  "additionalParams": {
    "temperature": 0.3
  }
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
  "createdAt": "2025-03-05T12:00:00.000Z",
  "autoExecuteTools": true,
  "cognition": false,
  "chainRun": false,
  "maxChainIterations": 5,
  "forceTool": false,
  "additionalParams": {
    "temperature": 0.7
  }
}
```

### Update Agent

Updates an existing agent with the provided configuration.

**Endpoint:** `PUT /api/agents/:id`

**URL Parameters:**
- `id` - The ID of the agent to update

**Request Body:**
Same as for creating an agent, but fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "id": "agent-123",
  "name": "Updated Weather Assistant",
  "model": "openai/gpt-4o",
  "systemPrompt": "You are a helpful assistant that provides detailed weather information.",
  "tools": [...],
  "createdAt": "2025-03-05T12:00:00.000Z",
  "updatedAt": "2025-03-05T15:30:00.000Z",
  "autoExecuteTools": true,
  "cognition": false,
  "chainRun": false,
  "maxChainIterations": 5,
  "forceTool": false
}
```

### Delete Agent

Deletes a specific agent.

**Endpoint:** `DELETE /api/agents/:id`

**URL Parameters:**
- `id` - The ID of the agent to delete

**Response:**
Status 204 No Content on success.

### Run Agent

Executes an agent with the provided input.

**Endpoint:** `POST /api/agents/:id/run`

**URL Parameters:**
- `id` - The ID of the agent to run

**Request Body:**
```json
{
  "input": "What's the weather like in San Francisco?"
}
```

**Response (for text output):**
```json
{
  "runId": "run-456",
  "success": true,
  "output": "The current weather in San Francisco is 65°F and foggy.",
  "outputType": "text",
  "completedAt": "2025-03-05T15:30:05.000Z",
  "error": null
}
```

**Response (for function calls):**
```json
{
  "runId": "run-456",
  "success": true,
  "output": "The current weather in San Francisco is 65°F and foggy.",
  "outputType": "functionCalls",
  "functionCalls": [
    {
      "functionName": "get_weather",
      "functionArgs": {
        "location": "San Francisco, CA"
      }
    }
  ],
  "completedAt": "2025-03-05T15:30:05.000Z",
  "error": null
}
```

**Response (for structured output):**
```json
{
  "runId": "run-456",
  "success": true,
  "output": {
    "temperature": 65,
    "conditions": "foggy",
    "humidity": 85
  },
  "outputType": "structured",
  "completedAt": "2025-03-05T15:30:05.000Z",
  "error": null
}
```

### Get Agent Runs

Retrieves all runs for a specific agent.

**Endpoint:** `GET /api/agents/:id/runs`

**URL Parameters:**
- `id` - The ID of the agent

**Response:**
```json
{
  "agentId": "agent-123",
  "agentName": "Weather Assistant",
  "runCount": 2,
  "runs": [
    {
      "id": "run-456",
      "status": "completed",
      "createdAt": "2025-03-05T15:30:00.000Z",
      "completedAt": "2025-03-05T15:30:05.000Z",
      "input": "What's the weather like in San Francisco?",
      "finalOutput": "The current weather in San Francisco is 65°F and foggy.",
      "error": null
    },
    {
      "id": "run-455",
      "status": "completed",
      "createdAt": "2025-03-05T15:00:00.000Z",
      "completedAt": "2025-03-05T15:00:05.000Z",
      "input": "What's the weather like in New York?",
      "finalOutput": "The current weather in New York is 72°F and partly cloudy.",
      "error": null
    }
  ]
}
```

## Pipeline Endpoints

### List All Pipelines

Retrieves a list of all available pipelines.

**Endpoint:** `GET /api/pipelines`

**Response:**
```json
[
  {
    "id": "pipeline-123",
    "name": "Weather Report Generator",
    "description": "Generates a detailed weather report for a given location",
    "steps": [...],
    "createdAt": "2025-03-05T12:00:00.000Z"
  },
  {...}
]
```

### Get Pipeline by ID

Retrieves a specific pipeline by its ID.

**Endpoint:** `GET /api/pipelines/:id`

**URL Parameters:**
- `id` - The ID of the pipeline to retrieve

**Query Parameters:**
- `includeLatestRun` (boolean, optional) - When set to 'true', includes details of the most recent run for this pipeline

**Response (without latest run):**
```json
{
  "id": "pipeline-123",
  "name": "Weather Report Generator",
  "description": "Generates a detailed weather report for a given location",
  "steps": [
    {
      "agentId": "agent-123",
      "inputTemplate": "{{input}}"
    },
    {
      "agentId": "agent-124",
      "inputTemplate": "Generate a detailed report based on this weather data: {{step0.output}}"
    }
  ],
  "outputDestinations": [
    {
      "type": "webhook",
      "target": "https://example.com/webhook"
    }
  ],
  "createdAt": "2025-03-05T12:00:00.000Z"
}
```

**Response (with latest run):**
```json
{
  "id": "pipeline-123",
  "name": "Weather Report Generator",
  "description": "Generates a detailed weather report for a given location",
  "steps": [...],
  "outputDestinations": [...],
  "createdAt": "2025-03-05T12:00:00.000Z",
  "latestRun": {
    "id": "run-789",
    "status": "completed",
    "createdAt": "2025-03-05T15:30:00.000Z",
    "completedAt": "2025-03-05T15:30:10.000Z",
    "input": "San Francisco",
    "finalOutput": "Weather Report for San Francisco:\n\nCurrent conditions: Foggy\nTemperature: 65°F\nHumidity: 85%\n...",
    "error": null
  }
}
```

### Create Pipeline

Creates a new pipeline with the provided configuration.

**Endpoint:** `POST /api/pipelines`

**Request Body:**
```json
{
  "name": "Weather Report Generator",
  "description": "Generates a detailed weather report for a given location",
  "steps": [
    {
      "agentId": "agent-123",
      "inputTemplate": "{{input}}"
    },
    {
      "agentId": "agent-124",
      "inputTemplate": "Generate a detailed report based on this weather data: {{step0.output}}"
    }
  ],
  "outputDestinations": [
    {
      "type": "webhook",
      "target": "https://example.com/webhook"
    }
  ]
}
```

**Response:**
```json
{
  "id": "pipeline-123",
  "name": "Weather Report Generator",
  "description": "Generates a detailed weather report for a given location",
  "steps": [...],
  "outputDestinations": [...],
  "createdAt": "2025-03-05T12:00:00.000Z"
}
```

### Update Pipeline

Updates an existing pipeline with the provided configuration.

**Endpoint:** `PUT /api/pipelines/:id`

**URL Parameters:**
- `id` - The ID of the pipeline to update

**Request Body:**
Same as for creating a pipeline, but fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "id": "pipeline-123",
  "name": "Updated Weather Report Generator",
  "description": "Generates a very detailed weather report for a given location",
  "steps": [...],
  "outputDestinations": [...],
  "createdAt": "2025-03-05T12:00:00.000Z",
  "updatedAt": "2025-03-05T16:00:00.000Z"
}
```

### Delete Pipeline

Deletes a specific pipeline.

**Endpoint:** `DELETE /api/pipelines/:id`

**URL Parameters:**
- `id` - The ID of the pipeline to delete

**Response:**
Status 204 No Content on success.

### Run Pipeline

Executes a pipeline with the provided input.

**Endpoint:** `POST /api/pipelines/:id/run`

**URL Parameters:**
- `id` - The ID of the pipeline to run

**Request Body:**
```json
{
  "input": "San Francisco"
}
```

**Response:**
```json
{
  "runId": "run-789",
  "status": "completed",
  "pipelineId": "pipeline-123",
  "pipelineName": "Weather Report Generator",
  "createdAt": "2025-03-05T15:30:00.000Z",
  "completedAt": "2025-03-05T15:30:10.000Z",
  "finalOutput": "Weather Report for San Francisco:\n\nCurrent conditions: Foggy\nTemperature: 65°F\nHumidity: 85%\n...",
  "error": null
}
```

### Get Pipeline Runs

Retrieves all runs for a specific pipeline.

**Endpoint:** `GET /api/pipelines/:id/runs`

**URL Parameters:**
- `id` - The ID of the pipeline

**Response:**
```json
{
  "pipelineId": "pipeline-123",
  "pipelineName": "Weather Report Generator",
  "runCount": 2,
  "runs": [
    {
      "id": "run-789",
      "status": "completed",
      "createdAt": "2025-03-05T15:30:00.000Z",
      "completedAt": "2025-03-05T15:30:10.000Z",
      "input": "San Francisco",
      "finalOutput": "Weather Report for San Francisco:\n\nCurrent conditions: Foggy\nTemperature: 65°F\nHumidity: 85%\n...",
      "error": null,
      "stepCount": 2
    },
    {
      "id": "run-788",
      "status": "completed",
      "createdAt": "2025-03-05T15:00:00.000Z",
      "completedAt": "2025-03-05T15:00:10.000Z",
      "input": "New York",
      "finalOutput": "Weather Report for New York:\n\nCurrent conditions: Partly Cloudy\nTemperature: 72°F\nHumidity: 60%\n...",
      "error": null,
      "stepCount": 2
    }
  ]
}
```

## Run Endpoints

### Get Run by ID

Retrieves the details of a specific run.

**Endpoint:** `GET /api/pipelines/runs/:runId`

**URL Parameters:**
- `runId` - The ID of the run to retrieve

**Response:**
```json
{
  "id": "run-789",
  "pipelineId": "pipeline-123",
  "input": "San Francisco",
  "outputs": [
    {
      "agentId": "agent-123",
      "output": "The current weather in San Francisco is 65°F and foggy, with 85% humidity.",
      "timestamp": "2025-03-05T15:30:05.000Z",
      "meta": {
        "functionCalls": [
          {
            "functionName": "get_weather",
            "functionArgs": {
              "location": "San Francisco, CA"
            }
          }
        ]
      }
    },
    {
      "agentId": "agent-124",
      "output": "Weather Report for San Francisco:\n\nCurrent conditions: Foggy\nTemperature: 65°F\nHumidity: 85%\n...",
      "timestamp": "2025-03-05T15:30:10.000Z"
    }
  ],
  "status": "completed",
  "finalOutput": "Weather Report for San Francisco:\n\nCurrent conditions: Foggy\nTemperature: 65°F\nHumidity: 85%\n...",
  "error": null,
  "createdAt": "2025-03-05T15:30:00.000Z",
  "completedAt": "2025-03-05T15:30:10.000Z"
}
```

## Response Formats

### Success Response

All successful responses will have appropriate HTTP status codes (usually 200 OK, 201 Created, or 204 No Content) and will contain a JSON body (except for 204 responses).

### Error Response

Error responses will have appropriate HTTP status codes (4xx for client errors, 5xx for server errors) and will contain a JSON body with error details:

```json
{
  "error": "Brief error description",
  "details": "More detailed error information (if available)"
}
```

## Error Handling

The API uses the following HTTP status codes for error responses:

- **400 Bad Request**: Invalid input parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

Each error response includes a descriptive message to help diagnose the issue.

## Request Rate Limiting

There are currently no rate limits implemented on the API. This may change in future versions.