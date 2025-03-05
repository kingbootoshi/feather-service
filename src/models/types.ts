// Types for the Feather Agent Service

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
  execute: (args: Record<string, any>) => Promise<{ result: string }>;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  createdAt: Date;
  tools?: Tool[];
  structuredOutputSchema?: {
    name?: string;
    strict?: boolean;
    schema: any;
  };
  autoExecuteTools?: boolean;
  cognition?: boolean;
  chainRun?: boolean;
  maxChainIterations?: number;
  forceTool?: boolean;
  additionalParams?: Record<string, any>;
}

export interface PipelineStep {
  agentId: string;
  inputFromPrevious?: boolean;
  inputMapping?: string; // e.g., 'direct', 'field.idea', etc.
}

export interface OutputDestination {
  type: string; // 'webhook', 'email', etc.
  target: string; // URL, email address, etc.
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  createdAt: Date;
  outputDestinations?: OutputDestination[];
}

export interface RunOutput {
  agentId: string;
  output: any;
  timestamp: Date;
  meta?: {
    functionCalls?: Array<{
      functionName: string;
      functionArgs: any;
    }>;
    structuredOutput?: boolean;
  };
}

export interface Run {
  id: string;
  pipelineId?: string;
  agentId?: string;
  input: string;
  outputs: RunOutput[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  finalOutput?: any;
  finalOutputMeta?: {
    functionCalls?: Array<{
      functionName: string;
      functionArgs: any;
    }>;
    structuredOutput?: boolean;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface StandardAgentOutput {
  success: boolean;
  output: string | object;
  functionCalls?: Array<{
    functionName: string;
    functionArgs: any;
  }>;
  structuredOutput?: boolean;
  error?: string;
}