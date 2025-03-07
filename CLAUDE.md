# Feather Service Project Guidelines

## Build & Run Commands
- `npm run build` - Build the TypeScript project
- `npm run dev` - Run development server with hot reload
- `npm run start` - Run production build
- `npm run watch` - Watch for file changes and recompile

## Linting & Type Checking
- `npx eslint src/**/*.ts` - Run ESLint on TypeScript files
- `npx tsc --noEmit` - Type check without emitting files

## Code Style
- **Imports:** ES6 import syntax, named imports for specific functions
- **Types:** Interfaces/Types use PascalCase, extensive TypeScript interfaces
- **Naming:** camelCase for variables/functions, PascalCase for types/interfaces
- **Functions:** Arrow functions for exports, proper return type annotations
- **Error Handling:** try/catch blocks with error type checking and status codes

## Project Structure
- Controllers handle HTTP requests, delegating to services
- Models define TypeScript interfaces
- Routes define API endpoints
- Views contain HTML templates
- Utils/services contain business logic and reusable functions

## Feather.ai Integration
This service wraps the feather-ai SDK for building and managing AI agents and pipelines.

## INSTRUCTIONS
1. If you do not have context of the docs of this project, open and read all the .md's from docs/

2. Once you are familiarized with the codebase, open up INSTRUCTIONS in the folder for_claude/INSTRUCTIONS.md. That folder also includes PROBLEMS.md and provided SOLUTIONS.md for you to implement.