1. Creating an agent dashboard is very plain. It does not support ALL of the different parameters that exist for a feather agent like structured output.

2. We need to be able to define function calls based on OpenAI's structured tool output (which is the standard feather agent follows).
Function tool calls in the feather agent framework can be auto-executed (default) or manual

Look at the feather docs as reference, but auto-execution means that an actual function call will execute based on the input from the feather agent, and the result of that function execution will be routed back to the 