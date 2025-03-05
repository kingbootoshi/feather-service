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
  structuredOutputSchema?: any;
  autoExecuteTools?: boolean;
  cognition?: boolean;
  chainRun?: boolean;
  maxChainIterations?: number;
  forceTool?: boolean;
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

export interface Run {
  id: string;
  pipelineId?: string;
  agentId?: string;
  input: string;
  outputs: Array<{
    agentId: string;
    output: any;
    timestamp: Date;
  }>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  finalOutput?: any;
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
  error?: string;
}