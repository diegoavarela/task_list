# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (opens automatically on port 5173)
- `npm run build` - TypeScript check + production build
- `npm run lint` - Run ESLint on TypeScript files
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a client-side task management application built with React, TypeScript, and Vite. Data persists in browser localStorage.

### Tech Stack
- **React 18** + **TypeScript** for type-safe UI development
- **Vite** for fast builds and HMR
- **Tailwind CSS** + **shadcn/ui** (New York style) for styling
- **@dnd-kit** for drag-and-drop task reordering
- **Radix UI** primitives for accessible components

### Key Architectural Patterns

1. **Component Organization**:
   - `/components/ui/` - shadcn/ui components (Button, Card, Dialog, etc.)
   - `/components/tasks/` - Task management components
   - `/components/company/` - Company organization components
   - `/pages/` - Top-level page components (TaskList, Companies, ConfigPage)

2. **State Management**: 
   - App-level state in `App.tsx` with prop drilling
   - Tasks and companies stored in localStorage via `lib/storage.ts`
   - Auto-save functionality with 500ms debounce

3. **Type System**:
   - Core types in `/types/`: `Task` and `Company` interfaces
   - Tasks support subtasks, due dates, reminders, and company associations
   - Companies have color coding for visual organization

4. **Routing**: 
   - Tab-based navigation between Tasks, Companies, and Config pages
   - Keyboard shortcuts: Cmd/Ctrl + 1/2/3 for navigation

5. **Import Alias**: `@/` maps to `src/` directory

### Working with Components

When modifying UI components:
- shadcn/ui components use CVA for variants
- Theme colors defined as CSS variables in `index.css`
- Dark mode supported via Tailwind's `dark:` prefix
- Toast notifications via `useToast()` hook

When working with tasks:
- Tasks have manual ordering via drag-and-drop
- Subtasks are stored as arrays within parent tasks
- Company badges use dynamic color classes from company configuration