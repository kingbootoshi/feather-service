1. Creating an agent dashboard is very plain. It does not support ALL of the different parameters that exist for a feather agent like structured output. Ensure we have FULL customability over a feather agent

2. We need to be able to define function calls based on OpenAI's structured tool output (which is the standard feather agent follows).
Function tool calls in the feather agent framework can be auto-executed (default) or manual

Look at the feather docs as reference, but auto-execution means that an actual function call will execute based on the input from the feather agent, and the result of that function execution will be routed back to the agent for the agent to do an output. This lets the agent do tool calls to get results (like internet searches) before outputting a final output

HOWEVER, if auto execution is off, then the result of the function call when the agent uses it IS the final output and must be processed as such. Sometimes, a function call is given with no execution.

If auto execution is on, can we also define the tools/function calls IN the server API template that can actually execute in code ? can we have live function calling in code based on user defined functions/new api calls?

Finally we have structured outputs too, structured outputs are incompatible with function calling, it is an OR operation. structured outputs OR function calling. Structured outputs are readable from the same output category for feather agents.

Can we please ensure that creating a feather agent has all this in depth data routed through. Also, look in research/4-5.md to understand how we can wrap the final output of agents to account for ALL function calls/structured output/regular output

3. Runs work, but when I click on a run detail it shows no info, however if you look in db/ we can see the full data for a run. Please fix this 

4. I should be able to see the latest result from the latest run of a pipeline. We should make an API call that shows us ALL run outputs, and show us what the input was, and what the output is.

5. Our codebase needs FULL detailed function logging through the whole process, we need to see each agents individual output, how its chained, final outputs, any function calls, tools, etc. Whole app should have logging throughout

6. Please make the API much more in depth and better it's very plain