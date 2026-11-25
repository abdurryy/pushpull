# Design guidelines

**Status: not started.** We write this after we've picked the project idea and made and tested the mock-ups. Until then there is no visual style: don't invent one, and keep styling minimal.

## How we'll get here

1. **Pick the idea** ([proposal.md](proposal.md)).
2. **Make a mock-up** of the main screens (paper or Figma). The proposal needs one anyway.
3. **Test the mock-up with a few users** and log it in [user-testing/](user-testing/README.md).
4. **Agree on a design direction** as a group: who the users are, what feeling the app should have, and which past projects or apps you like the look of.
5. **Fill in the sections below** and turn the decisions into CSS design tokens (`src/styles/tokens.css`) so every View uses the same values.
6. **Update [AGENTS.md](../AGENTS.md)** ("Design and UI") and `.coderabbit.yaml` with the rules agents and reviews should enforce.

## Sections to fill in

### Direction
_Who is it for? What should it feel like (playful, calm, fast, data-heavy…)? 2–3 reference apps or screenshots._

### Layout and navigation
_Mobile first? Breakpoints, page width, how users move between screens (tab bar, menu, back button)._

### Typography
_Font(s), size scale, heading style._

### Colour
_Primary colour, neutrals, colours for success and error. Check text contrast (WCAG AA: 4.5:1)._

### Spacing, shape and depth
_Spacing scale, corner radius, shadows._

### Components
_How buttons, inputs, cards, lists, loading, empty and error states look and behave._

### Icons and images
_One icon set (list it under third-party components in README.md), image style._

### Tokens
_Link to `src/styles/tokens.css` once it exists. Rule: Views use `var(--token)` and never hard-code colours or sizes._

### PR checklist for UI changes
_Short list everyone runs before opening a PR that touches UI._
