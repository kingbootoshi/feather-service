import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';

// Extend Request type definition to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Authentication middleware for API routes
 * Verifies JWT token or API key from the Authorization header
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the token (remove "Bearer " if present)
    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // First try to authenticate with API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', token)
      .single();
    
    if (apiKeyData) {
      console.log(`Request authenticated with API key for user: ${apiKeyData.user_id}`);
      
      // Update the last_used_at timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date() })
        .eq('key', token);
      
      // Set the userId on the request object
      req.userId = apiKeyData.user_id;
      return next();
    }
    
    // If not an API key, verify as a Supabase JWT
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.error('Authentication error:', error?.message || 'Invalid token');
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    console.log(`Request authenticated with JWT for user: ${data.user.id}`);
    req.userId = data.user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Authentication middleware for UI routes using Supabase session
 * Validates the session and redirects to login if invalid
 */
export const requireSupabaseSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check Supabase session from cookie
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      console.log('No valid session found, redirecting to login');
      const redirectUrl = req.originalUrl;
      return res.redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }

    // Session is valid, set userId for controllers
    req.userId = data.session.user.id;
    next();
  } catch (err) {
    console.error('Error checking session:', err);
    res.status(500).send('Internal Server Error');
  }
};