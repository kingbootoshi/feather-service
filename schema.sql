-- Schema for Feather Service Supabase Database

-- Create agents table
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tools JSONB,
    structured_output_schema JSONB,
    auto_execute_tools BOOLEAN DEFAULT false,
    cognition BOOLEAN DEFAULT false,
    chain_run BOOLEAN DEFAULT false,
    max_chain_iterations INTEGER,
    force_tool BOOLEAN DEFAULT false,
    additional_params JSONB
);

-- Create pipelines table
CREATE TABLE public.pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    output_destinations JSONB
);

-- Create runs table
CREATE TABLE public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    input TEXT NOT NULL,
    outputs JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    final_output JSONB,
    final_output_meta JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create API keys table
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Set up RLS (Row Level Security) for all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies that allow users to only see their own data
CREATE POLICY "Users can only view their own agents" ON agents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own agents" ON agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own agents" ON agents
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own agents" ON agents
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own pipelines" ON pipelines
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own pipelines" ON pipelines
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own pipelines" ON pipelines
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own pipelines" ON pipelines
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own runs" ON runs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own runs" ON runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own runs" ON runs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own runs" ON runs
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own api_keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own api_keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own api_keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);