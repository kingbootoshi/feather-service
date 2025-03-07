import { FeatherAgent } from 'feather-ai';
import { Agent, StandardAgentOutput } from '../models/types';

// Create a Feather Agent from our Agent model
export function createFeatherAgent(agent: Agent): FeatherAgent {
  console.log(`Creating Feather Agent for agent ID: ${agent.id}, model: ${agent.model}`);
  
  const config: any = {
    agentId: agent.id,
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    tools: agent.tools || [],
    autoExecuteTools: agent.autoExecuteTools !== undefined ? agent.autoExecuteTools : true,
    cognition: agent.cognition || false,
    chainRun: agent.chainRun || false,
    maxChainIterations: agent.maxChainIterations || 5,
    forceTool: agent.forceTool || false,
    structuredOutputSchema: agent.structuredOutputSchema,
    debug: true,
  };
  
  // Add any additional parameters
  if (agent.additionalParams) {
    console.log(`Adding additional parameters:`, agent.additionalParams);
    Object.assign(config, agent.additionalParams);
  }
  
  // Log if tools are configured
  if (agent.tools && agent.tools.length > 0) {
    console.log(`Configuring agent with ${agent.tools.length} tools`);
    agent.tools.forEach((tool, index) => {
      console.log(`Tool ${index + 1}: ${tool.function.name} - ${tool.function.description}`);
    });
  }
  
  // Log if structured output is configured
  if (agent.structuredOutputSchema) {
    // Create a copy of the schema that we can modify
    let schemaConfig = { ...agent.structuredOutputSchema };
    
    // Ensure schema has a name (required by OpenAI/Azure API)
    if (!schemaConfig.name) {
      console.log('Schema missing required name field, adding default name');
      schemaConfig.name = 'structured_output_schema';
    }
    
    // Fix schema name if it contains spaces (required by OpenRouter API)
    if (schemaConfig.name && schemaConfig.name.includes(' ')) {
      console.log(`Found invalid schema name with spaces: "${schemaConfig.name}"`);
      schemaConfig.name = schemaConfig.name.replace(/\s+/g, '_');
      console.log(`Fixed schema name to: "${schemaConfig.name}"`);
    }
    
    // Ensure additionalProperties: false for strict schemas
    if (schemaConfig.strict) {
      const fixObjectSchema = (schema: any) => {
        if (schema.type === 'object' && !('additionalProperties' in schema)) {
          console.log('Adding additionalProperties: false to object schema');
          schema.additionalProperties = false;
        }
        if (schema.properties) {
          Object.values(schema.properties).forEach(prop => fixObjectSchema(prop as any));
        }
        if (schema.items) {
          fixObjectSchema(schema.items);
        }
      };
      
      fixObjectSchema(schemaConfig.schema);
      console.log('Updated schema with additionalProperties: false where needed');
    }
    
    // Check for required/property mismatch and auto-fix
    if (schemaConfig.schema && schemaConfig.schema.required) {
      const requiredFields = [...schemaConfig.schema.required]; // Copy the array to avoid mutating original
      const properties = schemaConfig.schema.properties || {};
      let needsFixing = false;
      
      // Create a corrected required array
      const fixedRequired = [];
      
      for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!properties[field]) {
          console.warn(`Schema has required field "${field}" that doesn't match any property. Attempting to fix.`);
          console.log(`Properties available: ${Object.keys(properties).join(', ')}`);
          
          // Check several variations (camelCase, snake_case, with spaces)
          const possibleVariations = [
            field,
            // Try camelCase if it has underscores (video_idea -> videoIdea)
            field.replace(/_([a-z])/g, (g) => g[1].toUpperCase()),
            // Try snake_case if it has camelCase (videoIdea -> video_idea)
            field.replace(/([A-Z])/g, "_$1").toLowerCase(),
            // Try removing spaces (video idea -> videoidea)
            field.replace(/\s+/g, ""),
            // Try with spaces instead of underscores (video_idea -> video idea)
            field.replace(/_/g, " ")
          ];
          
          // Find a matching property
          let matchFound = false;
          for (const possibleName of possibleVariations) {
            if (properties[possibleName]) {
              console.log(`Found matching property "${possibleName}" for required field "${field}"`);
              fixedRequired.push(possibleName);
              matchFound = true;
              needsFixing = true;
              break;
            }
            
            // Try case-insensitive search
            const matchingProp = Object.keys(properties).find(
              prop => prop.toLowerCase() === possibleName.toLowerCase()
            );
            
            if (matchingProp) {
              console.log(`Found case-insensitive match "${matchingProp}" for required field "${field}"`);
              fixedRequired.push(matchingProp);
              matchFound = true;
              needsFixing = true;
              break;
            }
          }
          
          if (!matchFound) {
            console.error(`No matching property found for required field "${field}". Keeping as-is.`);
            fixedRequired.push(field); // Keep the original to avoid undefined errors
          }
        } else {
          fixedRequired.push(field); // Keep field as-is if it matches a property
        }
      }
      
      // Apply the fixed required array if needed
      if (needsFixing) {
        console.log(`Fixing schema.required: [${requiredFields.join(', ')}] -> [${fixedRequired.join(', ')}]`);
        schemaConfig.schema.required = fixedRequired;
      }
      
      // Do another check to make sure we didn't miss anything
      for (const field of schemaConfig.schema.required) {
        if (!properties[field]) {
          console.warn(`STILL UNRESOLVED: Required field "${field}" doesn't match any property!`);
        }
      }
    }
    
    // Apply the fixed schema to the config
    config.structuredOutputSchema = schemaConfig;
    
    console.log(`Configuring agent with structured output schema: ${schemaConfig.name}`);
    console.log(`Schema strict mode: ${schemaConfig.strict || false}`);
  }
  
  const featherAgent = new FeatherAgent(config);
  console.log(`Feather Agent created successfully for agent ID: ${agent.id}`);
  return featherAgent;
}

// Standardize agent output to ensure consistent handling regardless of output format
export function standardizeAgentOutput(result: any): StandardAgentOutput {
  console.log(`Standardizing agent output:`, JSON.stringify(result, null, 2));
  
  if (!result.success) {
    console.log(`Agent run was not successful, error: ${result.error || 'Unknown error'}`);
    return {
      success: false,
      output: '',
      error: result.error || 'Unknown error occurred',
    };
  }

  // Case 1: Manual function calls
  if (result.functionCalls && result.functionCalls.length > 0) {
    console.log(`Found ${result.functionCalls.length} manual function calls in the result`);
    
    // Return both the output (if present) and the function calls
    return {
      success: true,
      output: result.output || JSON.stringify(result.functionCalls),
      functionCalls: result.functionCalls.map((call: any) => ({
        functionName: call.functionName,
        functionArgs: call.functionArgs
      })),
    };
  }
  
  // Case 2: Structured output (JSON object rather than string)
  if (result.output && typeof result.output === 'object' && !Array.isArray(result.output)) {
    console.log(`Found structured output in the result`);
    return {
      success: true,
      output: result.output,
      structuredOutput: true
    };
  }

  // Case 3: Plain text output
  console.log(`Returning standard text output`);
  return {
    success: true,
    output: result.output,
  };
}

// Execute a single agent with input
export async function runAgent(agent: Agent, input: string): Promise<StandardAgentOutput> {
  console.log(`Running agent ${agent.id} (${agent.name}) with input: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`);
  
  try {
    console.log(`Creating Feather agent instance for ${agent.id}`);
    const featherAgent = createFeatherAgent(agent);
    
    console.log(`Executing agent run for ${agent.id}`);
    console.time(`Agent ${agent.id} execution time`);
    const result = await featherAgent.run(input);
    console.timeEnd(`Agent ${agent.id} execution time`);
    
    console.log(`Agent ${agent.id} execution completed successfully`);
    
    // Get standardized output
    const standardOutput = standardizeAgentOutput(result);
    
    // Log output details
    if (standardOutput.success) {
      if (standardOutput.functionCalls) {
        console.log(`Agent ${agent.id} returned function calls:`, standardOutput.functionCalls);
      }
      if (standardOutput.structuredOutput) {
        console.log(`Agent ${agent.id} returned structured output:`, 
          typeof standardOutput.output === 'object' ? 
            JSON.stringify(standardOutput.output, null, 2).substring(0, 500) : 
            'Invalid structured output');
      } else {
        console.log(`Agent ${agent.id} returned plain text output:`, 
          typeof standardOutput.output === 'string' ? 
            standardOutput.output.substring(0, 200) + (standardOutput.output.length > 200 ? '...' : '') : 
            JSON.stringify(standardOutput.output).substring(0, 200));
      }
    } else {
      console.error(`Agent ${agent.id} execution failed with error:`, standardOutput.error);
    }
    
    return standardOutput;
  } catch (error) {
    console.error(`Error running agent ${agent.id}:`, error);
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}