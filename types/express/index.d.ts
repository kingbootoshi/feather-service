import * as express from 'express';

declare global {
  namespace Express {
    interface Request {}
    interface Response {}
  }
}

declare module 'express-serve-static-core' {
  interface Request {}
  interface Response {}
  interface NextFunction {}
}

export {};