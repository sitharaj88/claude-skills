---
name: generate-component
description: Generates UI components with props, styles, tests, and stories, matching the project's frontend framework and existing component patterns. Use when the user asks to create a new component, add a UI element, or scaffold a frontend component.
argument-hint: "[ComponentName] [variant: form|list|detail|modal]"
allowed-tools: Read, Grep, Glob, Write, Edit
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a frontend expert. Generate a complete UI component for `$ARGUMENTS`, precisely matching the project's existing patterns.

### Step 1: Detect the framework

Search for framework indicators:
- **React**: `react` in package.json, `.jsx`/`.tsx` files, `import React`
- **Vue**: `vue` in package.json, `.vue` files
- **Svelte**: `svelte` in package.json, `.svelte` files
- **Angular**: `@angular/core` in package.json, `.component.ts` files
- **Solid**: `solid-js` in package.json

### Step 2: Study existing component patterns

Find 2-3 existing components. For each, analyze and note:

**File structure:**
- Single file (`Button.tsx`) vs directory (`Button/index.tsx`, `Button/Button.tsx`)
- Co-located styles, tests, stories, types

**Component pattern:**
- Function components vs class components
- Arrow functions vs function declarations
- Default export vs named export
- Props: interface vs type, inline vs separate file
- forwardRef usage, displayName

**Styling approach:**
- CSS Modules (`.module.css`/`.module.scss`)
- Tailwind CSS (utility classes)
- Styled-components / Emotion
- CSS-in-JS (vanilla-extract, etc.)
- Plain CSS/SCSS with BEM or other convention

**State and hooks:**
- Custom hooks pattern
- State management integration (Redux, Zustand, Context, etc.)

**Export pattern:**
- Barrel exports via `index.ts`
- Re-exports from parent directories

### Step 3: Parse component request

From `$ARGUMENTS`:
- `$0` = Component name (e.g., `UserProfile`, `DataTable`)
- `$1` = Optional variant hint:
  - `form` — form with inputs, validation, submit handler
  - `list` — renders a collection with optional filtering/sorting
  - `detail` — displays detailed info for a single entity
  - `modal` — dialog/overlay with open/close state

If no variant specified, infer from the component name.

### Step 4: Generate the component

Create all files matching the detected patterns:

**Component file:**
- Props interface/type with JSDoc comments for non-obvious props
- Component implementation following detected patterns exactly
- Sensible default props where appropriate
- Proper TypeScript types (no `any`)

**Styles file (if project uses separate style files):**
- Match the project's styling approach exactly
- Include responsive considerations if the project does
- Follow existing class naming conventions

**Test file:**
- Match test file naming and location conventions
- Test rendering without crashing
- Test prop handling (required props, optional props, defaults)
- Test user interactions (clicks, inputs, form submissions)
- Test conditional rendering states (loading, error, empty)

**Story file (only if Storybook is detected):**
- Match existing story format (CSF3 vs CSF2)
- Include default story and key variants
- Add args/controls for interactive props

### Step 5: Register the component

- If the project uses barrel exports (`index.ts`), add the export
- If there's a component library or registry, add the registration
- If there's a route that should use this component, note it (don't modify routes without asking)

### Step 6: Verify

- Check for TypeScript errors: are all types resolved?
- Verify imports exist (don't import from non-existent files)
- Ensure the component name doesn't conflict with existing components

### Guidelines

- Match the project EXACTLY — don't introduce new patterns
- If the project uses Tailwind, use Tailwind — don't add CSS modules
- If the project uses function declarations, don't use arrow functions
- If the project doesn't use Storybook, don't create stories
- Keep components focused — one responsibility per component
- Use semantic HTML elements
- Include accessibility attributes (aria-labels, roles) if the project does
