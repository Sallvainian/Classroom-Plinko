# Development Guide

## Prerequisites

### Required Software

- **Node.js**: Version 20 or higher
- **pnpm**: Package manager (recommended over npm/yarn)
  ```bash
  npm install -g pnpm
  ```
- **Git**: For version control

### Recommended Tools

- **VS Code**: IDE with Svelte extension
  - Extension: `svelte.svelte-vscode`
  - Extension: `bradlc.vscode-tailwindcss`
- **Chrome DevTools**: For debugging
- **Playwright Test Inspector**: For E2E test debugging

---

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/your-username/Classroom-Plinko.git
cd Classroom-Plinko
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies listed in `package.json` including:
- SvelteKit framework
- Vite build tool
- Tailwind CSS
- Matter.js physics engine
- Testing frameworks (Vitest, Playwright)

### 3. Start Development Server

```bash
pnpm dev
```

Server starts at: **http://localhost:5173**

Hot Module Replacement (HMR) is enabled - changes reflect immediately.

---

## Development Commands

### Core Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `pnpm dev` | Start dev server with HMR | Development |
| `pnpm build` | Build for production | Deployment prep |
| `pnpm preview` | Preview production build | Pre-deployment testing |
| `pnpm check` | Type-check TypeScript | Pre-commit validation |
| `pnpm check:watch` | Watch mode type-checking | Active development |

### Testing Commands

| Command | Purpose | Coverage |
|---------|---------|----------|
| `pnpm test` | Run all tests (unit + E2E) | Full test suite |
| `pnpm test:unit` | Run Vitest unit tests | Utils and logic |
| `pnpm test:unit run` | Single unit test run | CI/CD pipelines |
| `pnpm test:e2e` | Run Playwright E2E tests | User flows |
| `pnpm test:e2e:ui` | Playwright UI mode | Test debugging |

### Code Quality Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `pnpm lint` | Check code style (ESLint + Prettier) | Pre-commit |
| `pnpm format` | Auto-format code (Prettier) | Before committing |

---

## Project Structure for Development

```
src/
├── routes/              # Add new pages here
├── lib/
│   ├── components/      # Add new components here
│   ├── stores/          # Add new stores here
│   ├── utils/           # Add utility functions here
│   ├── types/           # Add TypeScript types here
│   └── constants/       # Add constants here
└── app.css              # Global styles
```

---

## Common Development Tasks

### Adding a New Component

1. Create component file:
   ```bash
   touch src/lib/components/MyComponent.svelte
   ```

2. Write component:
   ```svelte
   <script lang="ts">
     export let prop: string;
   </script>

   <div>{prop}</div>

   <style>
     div {
       @apply text-lg font-bold;
     }
   </style>
   ```

3. Import and use:
   ```svelte
   <script>
     import MyComponent from '$lib/components/MyComponent.svelte';
   </script>

   <MyComponent prop="Hello" />
   ```

### Adding a New Store

1. Create store file:
   ```bash
   touch src/lib/stores/myStore.ts
   ```

2. Define store:
   ```typescript
   import { writable } from 'svelte/store';

   export const myValue = writable<number>(0);
   ```

3. Use in components:
   ```svelte
   <script>
     import { myValue } from '$lib/stores/myStore';
   </script>

   <div>{$myValue}</div>
   <button on:click={() => $myValue++}>Increment</button>
   ```

### Adding a New Route

1. Create route file:
   ```bash
   mkdir -p src/routes/about
   touch src/routes/about/+page.svelte
   ```

2. Write page component:
   ```svelte
   <h1>About Page</h1>
   <p>This is a new page.</p>
   ```

3. Navigate to `/about` - automatic routing!

### Adding TypeScript Types

1. Add to existing type file:
   ```typescript
   // src/lib/types/index.ts
   export type MyNewType = {
     id: string;
     value: number;
   };
   ```

2. Use in components:
   ```typescript
   import type { MyNewType } from '$lib/types';

   const data: MyNewType = { id: '1', value: 42 };
   ```

---

## Testing

### Unit Testing (Vitest)

**Location:** `src/lib/utils/__tests__/`

**Example Test:**
```typescript
// colors.test.ts
import { describe, it, expect } from 'vitest';
import { interpolateRgbColors } from '../colors';

describe('interpolateRgbColors', () => {
  it('should interpolate between two colors', () => {
    const start = { r: 0, g: 0, b: 0 };
    const end = { r: 255, g: 255, b: 255 };
    const result = interpolateRgbColors(start, end, 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ r: 0, g: 0, b: 0 });
    expect(result[2]).toEqual({ r: 255, g: 255, b: 255 });
  });
});
```

**Run Tests:**
```bash
pnpm test:unit
```

### E2E Testing (Playwright)

**Location:** `tests/`

**Example Test:**
```typescript
// game.spec.ts
import { test, expect } from '@playwright/test';

test('should load game page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Plinko');
});

test('should place a bet', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Drop")');
  // Assert ball was dropped...
});
```

**Run E2E Tests:**
```bash
pnpm test:e2e
```

**Debug E2E Tests:**
```bash
pnpm test:e2e:ui
```

---

## Build Process

### Development Build

```bash
pnpm dev
```

- **Vite dev server** on port 5173
- **HMR enabled** - instant updates
- **Source maps** for debugging
- **No minification**

### Production Build

```bash
pnpm build
```

**Build Steps:**
1. TypeScript type-checking
2. Svelte compilation
3. Vite bundling
4. Tailwind CSS processing
5. Static HTML generation (SSG)
6. Asset optimization (minification, tree-shaking)
7. Output to `build/` directory

**Preview Production Build:**
```bash
pnpm preview
```

---

## Environment Variables

### `.env` File (not included in repo)

```
# Public variables (exposed to browser)
PUBLIC_API_URL=https://api.example.com

# Private variables (server-side only, not used in this static app)
SECRET_KEY=xxx
```

**Access in Code:**
```typescript
import { PUBLIC_API_URL } from '$env/static/public';
```

---

## Code Style

### ESLint Configuration

**File:** `.eslintrc.cjs`

**Rules:**
- Svelte-specific linting
- TypeScript best practices
- Tailwind CSS class ordering

**Run Linter:**
```bash
pnpm lint
```

### Prettier Configuration

**File:** `.prettierrc`

**Settings:**
- Single quotes
- Tab width: 2 spaces
- Trailing commas
- Svelte plugin for `.svelte` files

**Format Code:**
```bash
pnpm format
```

---

## Git Workflow

### Branching Strategy

```
main                    # Production-ready code
  ├── feature/xxx       # New features
  ├── bugfix/xxx        # Bug fixes
  └── hotfix/xxx        # Urgent production fixes
```

### Commit Messages

Use conventional commits:
```
feat: add auto-bet mode
fix: correct payout calculation for 16 rows
docs: update README with deployment instructions
style: format code with Prettier
test: add unit tests for color interpolation
```

### Pre-Commit Checklist

1. ✅ Run `pnpm lint` - no errors
2. ✅ Run `pnpm format` - code formatted
3. ✅ Run `pnpm check` - types valid
4. ✅ Run `pnpm test:unit run` - tests pass
5. ✅ Commit with conventional commit message

---

## Debugging

### Browser DevTools

**Svelte DevTools** - Chrome extension
- Inspect component state
- View store values
- Track reactivity

**Network Tab**
- Monitor asset loading
- Check bundle sizes

**Performance Tab**
- Profile rendering
- Identify bottlenecks

### VS Code Debugging

**`.vscode/launch.json`:**
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Launch Chrome",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/src"
}
```

Press **F5** to start debugging.

---

## Performance Optimization

### Bundle Size

**Check Bundle:**
```bash
pnpm build
ls -lh build/_app/immutable/chunks/
```

**Strategies:**
- Code splitting (automatic in SvelteKit)
- Tree shaking (automatic in Vite)
- Lazy loading (use `import()` for dynamic imports)

### Runtime Performance

**Profiling:**
1. Open Chrome DevTools
2. Go to Performance tab
3. Record gameplay session
4. Analyze flamegraph

**Common Optimizations:**
- Reduce store subscriptions
- Throttle animation frames
- Use `requestAnimationFrame` for physics
- Disable animations in auto-bet mode

---

## Deployment

### GitHub Pages (Current)

**Workflow:** `.github/workflows/deploy.yml`

**Steps:**
1. Push to `main` branch
2. GitHub Actions runs `pnpm build`
3. Deploys `build/` to `gh-pages` branch
4. Site live at `https://username.github.io/Classroom-Plinko`

### Alternative Deployment Targets

**Vercel:**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy
```

**Cloudflare Pages:**
- Connect GitHub repo
- Build command: `pnpm build`
- Output directory: `build`

---

## Troubleshooting

### Common Issues

**Issue:** `pnpm install` fails
- **Solution:** Delete `node_modules` and `pnpm-lock.yaml`, run `pnpm install` again

**Issue:** TypeScript errors in VS Code
- **Solution:** Run `pnpm check` to sync types, restart TS server (Cmd+Shift+P → "Restart TypeScript")

**Issue:** HMR not working
- **Solution:** Check if port 5173 is blocked, try `pnpm dev --host`

**Issue:** Build fails with memory error
- **Solution:** Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 pnpm build`

**Issue:** E2E tests timing out
- **Solution:** Check `playwright.config.ts` timeout settings, ensure dev server is running

---

## Additional Resources

- **SvelteKit Docs:** https://kit.svelte.dev/docs
- **Svelte Tutorial:** https://svelte.dev/tutorial
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Vite Guide:** https://vitejs.dev/guide
- **Matter.js Docs:** https://brm.io/matter-js/docs
- **Vitest Docs:** https://vitest.dev
- **Playwright Docs:** https://playwright.dev

---

*Generated: 2025-10-22*
*Development Guide Version: 1.0*
