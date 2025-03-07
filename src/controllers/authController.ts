import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { createApiKey, getAllApiKeys, deleteApiKey } from '../db/database';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Error registering user:', error);
      res.status(400).json({ error: error.message });
      return;
    }
    
    console.log(`User registered successfully: ${data.user?.id}`);
    
    // Return success response
    res.status(201).json({
      message: 'Registration successful. Please check your email for verification.',
      userId: data.user?.id
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ 
      error: 'Failed to register user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Login a user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const redirectUrl = req.query.redirect as string || '/agents';
    
    console.log('Login attempt for:', email);
    console.log('Redirect URL:', redirectUrl);
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message });
      return;
    }
    
    console.log(`User authenticated successfully: ${data.user.id}`);
    
    // Always return JSON with the session data
    // The frontend JavaScript will handle the redirect
    res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in
      },
      redirect: redirectUrl
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      error: 'Failed to login',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Generate an API key for the current user
export const generateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if userId is set by the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Create a new API key
    const apiKey = await createApiKey(req.userId);
    
    console.log(`API key generated for user: ${req.userId}`);
    
    // Return the API key
    res.status(201).json(apiKey);
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ 
      error: 'Failed to generate API key',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all API keys for the current user
export const getApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if userId is set by the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Get all API keys
    const apiKeys = await getAllApiKeys(req.userId);
    
    // Return the API keys
    res.status(200).json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ 
      error: 'Failed to fetch API keys',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete an API key
export const removeApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if userId is set by the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const keyId = req.params.id;
    
    // Delete the API key
    const deleted = await deleteApiKey(keyId, req.userId);
    
    if (!deleted) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }
    
    console.log(`API key deleted: ${keyId}`);
    
    // Return success
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ 
      error: 'Failed to delete API key',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};