# Generate Component

Creates UI components with props, styles, tests, and stories matching your frontend framework. This skill analyzes your existing codebase to produce components that follow your project's established conventions -- from file naming to prop patterns to test structure.

## Quick Start

```bash
# Generate a form-style component
/generate-component UserProfile form

# Generate a list-style component
/generate-component DataTable list

# Generate with default variant
/generate-component NavigationBar
```

## Arguments

| Argument | Position | Required | Description |
|----------|----------|----------|-------------|
| `ComponentName` | `$0` | Yes | Name of the component in **PascalCase** (e.g., `UserProfile`, `DataTable`) |
| `variant` | `$1` | No | Component variant: `form`, `list`, `detail`, or `modal` |

::: tip
The component name must be in PascalCase. The skill will use this exact casing for the component file and adjust related filenames (tests, stories, styles) to match your project's naming convention.
:::

## How It Works

1. **Detects framework and styling** -- Identifies whether you are using React, Vue, Svelte, Angular, or Solid, along with your styling approach (CSS Modules, Tailwind, styled-components, Emotion).
2. **Studies existing components** -- Reads 2-3 existing components in your project to learn patterns including file structure, export style, prop patterns, and test conventions.
3. **Generates component files** -- Creates the component file, associated styles, a test file, and a Storybook story file (if Storybook is detected in the project).
4. **Updates barrel exports** -- If your project uses `index.ts` or `index.js` barrel files, the skill automatically adds the new component to them.
5. **Verifies correctness** -- Confirms that TypeScript types resolve and all imports reference existing modules.

## Supported Frameworks

| Category | Supported |
|----------|-----------|
| **UI Frameworks** | React, Vue, Svelte, Angular, Solid |
| **Styling** | CSS Modules, Tailwind CSS, styled-components, Emotion |
| **Testing** | Jest, Vitest, Testing Library, Cypress Component Testing |
| **Stories** | Storybook (CSF3 format) |

## Example

Suppose you have a React + Tailwind project and run:

```bash
/generate-component UserProfile form
```

The skill examines your existing components, then generates:

```
src/components/UserProfile/
  UserProfile.tsx          # Component with form fields, validation, submit handler
  UserProfile.test.tsx     # Tests for rendering, validation, and submission
  UserProfile.stories.tsx  # Storybook story with controls for each prop
  index.ts                 # Barrel export
```

The generated `UserProfile.tsx` will mirror the patterns found in your codebase -- matching your preferred hook usage, form handling library, prop typing style, and Tailwind class conventions.

::: warning
If the skill cannot find at least one existing component to use as a reference, it will fall back to sensible defaults for the detected framework. Review the output to ensure it aligns with your project standards.
:::

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `inline` |
| **Allowed tools** | `Read`, `Grep`, `Glob`, `Write`, `Edit` |

This skill operates in inline context mode, meaning it runs within your current conversation and has read/write access to your project files. It does not execute shell commands or modify configuration outside of source files.
