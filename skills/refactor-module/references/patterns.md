# Code Smell Catalog and Refactoring Recipes

## Smell: Long Method

**Detection**: Function body exceeds 30-40 lines or has multiple distinct sections separated by comments.

**Refactoring recipes:**
1. **Extract Method** — Move a coherent block of code into its own named function
   - Look for comments that describe what a section does — that's a function name
   - Look for variables used only within a section — those become parameters or local state
2. **Replace Temp with Query** — If a variable is assigned once and used to store a computed value, extract the computation into a function
3. **Decompose Conditional** — If a large if/else block has substantial logic in each branch, extract each branch into a named function

## Smell: Deep Nesting

**Detection**: More than 3 levels of indentation from conditionals, loops, or try/catch.

**Refactoring recipes:**
1. **Guard Clauses** — Invert conditions and return early instead of nesting
   ```
   // Before:
   if (user) {
     if (user.isActive) {
       if (user.hasPermission) {
         doThing();
       }
     }
   }

   // After:
   if (!user) return;
   if (!user.isActive) return;
   if (!user.hasPermission) return;
   doThing();
   ```
2. **Extract Method** — Pull the inner body into its own function, reducing visible nesting
3. **Replace Loop with Pipeline** — Convert nested loops with conditions into filter/map/reduce chains

## Smell: Duplicated Logic

**Detection**: Two or more code blocks with similar structure, differing only in specific values or minor details.

**Refactoring recipes:**
1. **Extract Method with Parameters** — Pull the common logic into a function, parameterizing the differences
2. **Template Method Pattern** — If the duplication spans classes, extract the common flow with hook methods
3. **Configuration Object** — If the differences are just values, extract a configuration and use a single implementation

**Note**: Only extract when the duplication is in the SAME concern. Two blocks that look similar but serve different domain purposes should often stay separate — they may diverge in the future.

## Smell: God Object / God Class

**Detection**: A class or module with many responsibilities, many methods, and most other modules depend on it.

**Refactoring recipes:**
1. **Extract Class** — Group related methods and data into a new class/module by responsibility
2. **Move Method** — Move methods to the class whose data they primarily use
3. **Façade Pattern** — If many callers depend on the god object, create a façade that delegates to the new smaller classes

## Smell: Feature Envy

**Detection**: A function that accesses more data from another object/module than its own.

**Refactoring recipes:**
1. **Move Method** — Move the function to the module whose data it primarily uses
2. **Extract and Move** — Extract the envious part into its own function, then move it

## Smell: Primitive Obsession

**Detection**: Using strings, numbers, or arrays for domain concepts (email addresses, money, coordinates, date ranges).

**Refactoring recipes:**
1. **Introduce Value Object** — Create a type/class that wraps the primitive with validation and behavior
   ```
   // Before: email is just a string everywhere
   function sendEmail(to: string) { ... }

   // After: Email is a validated type
   class Email {
     constructor(value: string) {
       if (!value.includes('@')) throw new Error('Invalid email');
       this.value = value;
     }
   }
   function sendEmail(to: Email) { ... }
   ```
2. **Replace Type Code with Subclasses** — If a primitive determines behavior via switch/if, use polymorphism

## Smell: Long Parameter List

**Detection**: Functions with more than 3-4 parameters.

**Refactoring recipes:**
1. **Introduce Parameter Object** — Group related parameters into an options/config object
   ```
   // Before:
   function createUser(name, email, age, role, department, startDate) { ... }

   // After:
   function createUser(params: CreateUserParams) { ... }
   ```
2. **Preserve Whole Object** — If multiple params come from the same object, pass the object instead

## Smell: Dead Code

**Detection**: Functions, variables, imports, or branches that are never used.

**Refactoring recipes:**
1. **Delete it** — The safest refactoring. Version control has the history if it's ever needed.
2. **Verify first** — Use Grep to search the entire codebase for references before deleting
   - Check for dynamic references (string-based lookups, reflection)
   - Check for references in tests, config files, and documentation

## Smell: Magic Numbers / Strings

**Detection**: Literal values in code without explanation.

**Refactoring recipes:**
1. **Extract Constant** — Give the value a descriptive name
   ```
   // Before:
   if (retries > 3) { ... }
   if (status === 'PROC_PENDING') { ... }

   // After:
   const MAX_RETRIES = 3;
   const STATUS_PENDING = 'PROC_PENDING';
   ```
2. **Extract Enum** — If there are multiple related magic values, create an enum or constants object

## General principles

- **The Rule of Three**: Don't extract on the first occurrence. Wait until you see the pattern three times.
- **Preserve behavior first, improve structure second**: Never change what code does while changing how it's structured.
- **Name things well**: The extracted function/class name should make the calling code read like documentation.
- **Keep the public API stable**: Internal refactoring should not break callers.
