# AGENTS.md - Development Guidelines for AyAIs

This file contains essential development guidelines for coding agents working on the AyAIs project. Follow these guidelines to maintain consistency and quality across the codebase.

## Project Overview

**AyAIs** is a cross-platform desktop application (Windows, Mac, Linux) that provides quick access to AI services through an integrated browser interface.

### Key Features

- **Multiview Interface**: Sidebar navigation with colored icons for each AI service, content area displays the selected AI website
- **Integrated Browser**: Webview component with persistent sessions and cookies
- **Global OS Shortcuts**: Configurable system-wide shortcuts to show/hide the application
- **AI Services Support**: ChatGPT, Claude, Gemini (with extensibility for more)
- **Theming**: Light, dark, and auto themes based on system preferences
- **Launch on Startup**: Optional system integration for auto-startup

### Technical Stack

- **Frontend**: Angular 21 with PrimeNG UI components and TailwindCSS styling
- **Desktop**: Electron for cross-platform distribution
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Architecture**: Standalone Angular components with modern control flow syntax (@if, @for, @switch)

### Core Principles

- **No Feature Bloat**: Focus on core functionality - AI services handle their own history/bookmarks
- **Session Persistence**: Maintain browser sessions between app restarts
- **Quick Switching**: Instant switching between different AI services

### Language and Communication Guidelines

- **Chat Discussions**: Exclusively in French
- **Code**: Exclusively in English (class names, function names, variables, comments, etc.)
- **Documentation**: Primarily in English, with French translations when necessary
- **Commit Messages**: In English following conventional commit format

## Build, Lint, and Test Commands

### Build Commands

- **Development Build**: `npm run build` or `ng build --base-href ./`
- **Production Build**: `npm run web:prod` or `ng build --base-href ./ -c production`
- **Electron Build**: `npm run electron:build`
- **Serve Development**: `npm run ng:serve` or `ng serve -c dev`

### Lint Commands

- **Lint All**: `npm run lint` or `ng lint`
- **Lint Specific Files**: `ng lint --files src/app/**/*.ts`
- **Auto-fix Lint Issues**: `ng lint --fix`

### Test Commands

- **Run All Tests**: `npm test` or `ng test --watch=false`
- **Run Tests in Watch Mode**: `npm run test:watch` or `ng test`
- **Run Single Test File**: `ng test --include="**/component-name.spec.ts"`
- **Run Tests for Specific Component**: `ng test --include="src/app/shared/components/sidebar.component.spec.ts"`
- **Run Tests with Coverage**: `ng test --watch=false --coverage`
- **Run Tests for Specific Directory**: `ng test --include="src/app/shared/**/*.spec.ts"`

### End-to-End Tests

- **Run E2E Tests**: `npm run e2e`
- **Run E2E with Tracing**: `npm run e2e:show-trace`

### Electron Commands

- **Start Electron App**: `npm start`
- **Start Electron in Serve Mode**: `npm run electron:serve`
- **Start Electron Locally**: `npm run electron:local`
- **Build**: `npm run electron:build`

## Code Style Guidelines

### TypeScript Configuration

- **Strict Mode**: Enabled (`"strict": true`)
- **Target**: ES2022
- **Module Resolution**: Bundler
- **Angular Compiler Options**:
  - `strictTemplates: true`
  - `fullTemplateTypeCheck: true`
  - `strictInjectionParameters: true`

### Import Organization

```typescript
// Angular imports first
import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

// Third-party imports
import { Observable } from 'rxjs';

// Local imports with path mapping
import { AIService } from './types';

// Relative imports
import { HelperService } from '../services/helper.service';
```

### Component Structure

#### File Organization

**CRITICAL: Template and Style Files**

- **ALL Angular components MUST use separate files** for templates and styles:
  - `component-name.component.ts` - TypeScript class
  - `component-name.component.html` - Template (MANDATORY - never inline)
  - `component-name.component.css` - Styles (when needed)
- **NEVER use inline templates** (`template: '...'` is STRICTLY FORBIDDEN)
- **NEVER use inline styles** (`styles: '...'` is STRICTLY FORBIDDEN)
- **ALWAYS use `templateUrl`** instead of `template`
- **ALWAYS use `styleUrl`** instead of `styles` when custom CSS is needed

**Rationale**: Separating templates and styles into dedicated files improves:

- Code maintainability and readability
- IDE support and syntax highlighting
- Team collaboration and code reviews
- Testing and debugging capabilities
- Performance optimization opportunities

#### Styling Guidelines

- **Prefer TailwindCSS over component-specific CSS** by default
- Only create component-specific CSS files when Tailwind classes are insufficient
- Use component-scoped styles with BEM methodology when custom CSS is required
- Keep component styles minimal and focused on layout-specific needs

```typescript
import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ComponentInterface {
  property: string;
}

@Component({
  selector: 'app-component-name',
  imports: [CommonModule],
  templateUrl: './component-name.component.html',
  styleUrl: './component-name.component.css', // Only if custom styles needed
})
export class ComponentName {
  // Public properties
  public property: string;

  // Outputs
  eventEmitted = output<ComponentInterface>();

  // Constructor
  constructor() {}

  // Public methods
  public methodName(): void {
    // Implementation
  }

  // Private methods
  private privateMethod(): void {
    // Implementation
  }
}
```

### Naming Conventions

#### Components

- **Selector**: `app-component-name` (kebab-case with app prefix)
- **Class Name**: `ComponentName` (PascalCase)
- **File Name**: `component-name.component.ts`

#### Services

- **Class Name**: `ServiceNameService` (PascalCase with Service suffix)
- **File Name**: `service-name.service.ts`

#### Interfaces

- **Name**: `InterfaceName` (PascalCase)
- **File Name**: `interface-name.interface.ts` or defined in component file

#### Methods and Properties

- **Public Methods**: `camelCase`
- **Private Methods**: `camelCase`
- **Properties**: `camelCase`
- **Constants**: `UPPER_CASE`
- **Outputs**: `eventNameEmitted = output<Type>()`

### TypeScript Best Practices

#### Type Safety

- Always use explicit types for method parameters and return values
- Use `unknown` instead of `any` when type is uncertain
- Leverage Angular 21 signals and modern APIs

#### Modern Angular Patterns

```typescript
// Use signals instead of traditional properties
import { signal } from '@angular/core';

export class MyComponent {
  count = signal(0);

  increment() {
    this.count.update((value) => value + 1);
  }
}
```

#### Control Flow Statements

```typescript
// ALWAYS use braces for control flow statements
// NEVER use single-line if statements without braces

// ❌ NEVER - Single-line if without braces
if (!currentService) return;

// ✅ ALWAYS - Multi-line with braces
if (!currentService) {
  return;
}

// ❌ NEVER - Single-line if/else without braces
if (condition) doSomething();
else doSomethingElse();

// ✅ ALWAYS - Multi-line with braces
if (condition) {
  doSomething();
} else {
  doSomethingElse();
}
```

#### Control Flow Syntax

```typescript
// Use @if, @for, @switch instead of *ngIf, *ngFor
@if (condition) {
  <div>Content</div>
} @else {
  <div>Alternative</div>
}

@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

### Error Handling

```typescript
// Use try-catch for synchronous operations
try {
  const result = this.processData(data);
  this.handleSuccess(result);
} catch (error) {
  console.error('Error processing data:', error);
  this.handleError(error);
}

// Use RxJS error handling for observables
this.http
  .get('/api/data')
  .pipe(
    catchError((error) => {
      console.error('HTTP Error:', error);
      return of(null); // Return fallback value
    })
  )
  .subscribe((result) => {
    if (result) {
      this.data = result;
    }
  });
```

### Testing Guidelines

#### Mandatory Testing Workflow for Every Code Change

**CRITICAL: For EVERY code addition, modification, or deletion, you MUST systematically:**

1. **Add Tests for New Features**
   - Create comprehensive unit tests for any new functionality
   - Test both success and error scenarios
   - Ensure edge cases are covered

2. **Update Tests for Modified Code**
   - Review and update ALL existing tests affected by your changes
   - Ensure tests still pass after modifications
   - Add new test cases if behavior has changed

3. **Remove Obsolete Tests**
   - Delete tests that are no longer relevant after code removal
   - Remove test cases for functionality that has been removed
   - Keep test suite clean and focused on current code behavior

4. **Run and Verify Tests**
   - **ALWAYS run `npm test`** after making changes
   - **DO NOT consider work complete** until ALL tests pass
   - Fix both code and test failures until everything passes
   - If tests fail, determine if it's a code issue or test issue and fix accordingly

5. **Test Quality Standards**
   - Test files must follow naming pattern: `artifact-name.spec.ts`
   - Place test files alongside implementation files
   - Tests must be meaningful and test actual behavior, not just coverage metrics
   - Use appropriate mocking for external dependencies

**This workflow is MANDATORY for EVERY code change, no matter how small.**

#### Mandatory Unit Testing Requirements for Angular

- **Always create unit tests** for every new component, service, directive, pipe, or other Angular artifact
- **Always update existing unit tests** when modifying any component, service, directive, pipe, or other Angular artifact
- Test files must be created alongside the implementation file with the naming pattern: `artifact-name.spec.ts`
- Tests must cover both success and error scenarios
- All tests must pass before considering the work complete

#### Unit Tests

- Use Vitest as the test runner
- Place test files alongside implementation: `component.spec.ts`
- Test both success and error scenarios
- Mock external dependencies

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle error conditions', () => {
    expect(() => service.methodThatThrows()).toThrow();
  });
});
```

#### Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Styling Guidelines

#### CSS Structure

```css
.component-name {
  /* Component root styles */
}

.component-name__header {
  /* BEM-style modifiers */
}

.component-name__content {
  /* Content styles */
}

.component-name--active {
  /* Modifier styles */
}
```

#### CSS Best Practices

- Use component-scoped styles
- Avoid global styles unless necessary
- Use CSS custom properties for theming
- Follow BEM methodology for class naming

### File Organization

```
src/
├── app/
│   ├── components/
│   │   └── feature/
│   │       ├── feature.component.ts
│   │       ├── feature.component.html
│   │       ├── feature.component.css
│   │       └── feature.component.spec.ts
│   ├── services/
│   │   └── feature.service.ts
│   ├── directives/
│   │   └── feature.directive.ts
│   └── pipes/
│       └── feature.pipe.ts
├── environments/
├── assets/
└── styles.css
```

### Git Workflow

- Use conventional commits
- Branch naming: `feature/feature-name`, `bugfix/bug-name`, `hotfix/hotfix-name`
- Pull requests require review
- Automated CI/CD runs lint, test, and build checks

### Performance Considerations

- Use `OnPush` change detection where possible
- Implement lazy loading for routes
- Use Angular's built-in performance tools
- Optimize bundle size with tree-shaking

### Accessibility

- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure keyboard navigation support
- Test with screen readers

### Internationalization

- Use Angular i18n for translations
- Store translation keys in `src/assets/i18n/`
- Use the translate pipe: `{{ 'key' | translate }}`

### Electron Development Guidelines

#### Main Process (app/)

- Keep main process lightweight - delegate UI logic to renderer process
- Use IPC channels for communication between main and renderer processes
- Handle window management, global shortcuts, and system integration
- Implement auto-updater functionality for production builds

#### Renderer Process (src/)

- Use Angular services for Electron API access (avoid direct imports)
- Handle webview creation and management through Angular components
- Implement session persistence for browser cookies and state
- Manage global shortcuts and window controls through Electron APIs

#### Security Considerations

- Validate all IPC messages between processes
- Use contextBridge for secure API exposure to renderer
- Implement proper CSP (Content Security Policy) headers
- Avoid Node.js integration in renderer process unless necessary

#### Webview Integration

- Use Electron's webview or BrowserView for AI service integration
- Implement proper session management for persistent logins
- Handle navigation events and URL validation
- Ensure proper cleanup of webview instances

### Build and Deployment

- Use electron-builder for cross-platform builds
- Configure platform-specific settings in electron-builder.json
- Include proper app metadata and icons for each platform
- Test builds on all target platforms (Windows, Mac, Linux)

#### CRITICAL: Build Workflow Synchronization

**When modifying build-related files, you MUST also update the corresponding GitHub Actions workflow files:**

- **electron-builder.json changes** → Update `.github/workflows/{macos,linux,windows}.yml`
- **New build artifacts** → Add artifact paths to workflow upload steps
- **Platform-specific targets** → Verify all three platform workflows are consistent
- **Build dependencies** → Update `build-electron.js` if needed

**Common workflow modifications required:**

- Adding new file types to artifacts (e.g., `.zip` for macOS updates)
- Updating metadata file patterns (`latest-*.yml`)
- Modifying build commands or flags
- Changing electron-builder target configurations

**Example**: When macOS was updated to include ZIP files for auto-updater:

1. Modified `electron-builder.json`: `target: ["dmg", "zip"]`
2. Updated `.github/workflows/macos.yml`: Added `release/**/*.zip` to upload artifacts

**Verification step**: After modifying build configuration, always check if the corresponding workflow file needs updating to upload the new artifacts.

### Auto-Updater Configuration

The app uses electron-updater for automatic updates. Key requirements:

- **Update Metadata**: electron-builder automatically generates `latest-linux.yml`, `latest-mac.yml`, and `latest.yml` (Windows)
- **Publish to GitHub**: Use `npm run electron:build` to build and upload artifacts to GitHub releases
- **Release Assets**: Each release must include:
  - Platform-specific installers (AppImage, DMG, NSIS)
  - Corresponding `latest-*.yml` files (auto-generated by electron-builder)
  - Block maps (`*.yaml.blockmap`) for differential updates
- **Build Command**: Always use `electron:build` when preparing production releases
- **Version Management**: Update `version` in package.json before building

Note: The auto-updater checks for updates at startup and can be manually triggered by users through the app menu.

### Icon Usage Guidelines

**CRITICAL: This project uses FortAwesome (FontAwesome) for icons, NOT PrimeNG PrimeIcons**

- **ALL icons must use FortAwesome** - Never use PrimeNG icons (`pi` classes or `[icon]` with PrimeNG icon names)
- **Icon Library Initialization**: All FortAwesome icons are pre-registered in `src/app/app.component.ts`
- **Adding New Icons**: To add a new icon to the project:
  1.  Import the icon from `@fortawesome/free-solid-svg-icons` in `app.component.ts`
  2.  Add it to the icon library using `this.fortAwesomeIconLibrary.addIcons(yourNewIcon)`
- **Using Icons in Templates**: Use the `<fa-icon>` component with the imported icon name:

  ```html
  <!-- ✅ CORRECT - FortAwesome icon with self-closing tag -->
  <fa-icon [icon]="['fas', 'refresh']" />

  <!-- ❌ WRONG - PrimeNG icon (NEVER use) -->
  <i class="pi pi-refresh"></i>
  <p-button icon="pi pi-refresh"></p-button>
  ```

- **Available Icons**: Check `src/app/app.component.ts` for the list of registered icons
- **Common Icon Mappings**:
  - `pi-refresh` → `fa-refresh`
  - `pi-info-circle` → `fa-info-circle`
  - `pi-times` → `fa-times`
  - `pi-arrow-left` → `fa-arrow-left`
  - `pi-clock` → `fa-clock`
  - `pi-download` → `fa-download`

### HTML Template Guidelines

**Self-Closing Tags for Angular Components**

- **ALWAYS use self-closing tags** for Angular components that don't have content
- **Self-closing syntax**: Use `<component />` instead of `<component></component>`
- **When to use self-closing tags**:
  - Components without child content (e.g., `<fa-icon />`, `<p-progressSpinner />`)
  - Empty structural elements
  - Standalone UI elements
- **When NOT to use self-closing tags**:
  - Components with child content or projections
  - Elements that contain text or other elements

Examples:

```html
<!-- ✅ CORRECT - Self-closing tags for components without content -->
<fa-icon [icon]="['fas', 'refresh']" />
<fa-icon [icon]="['fas', 'info-circle']" />

<!-- ❌ WRONG - Opening/closing tags for empty components -->
<fa-icon [icon]="['fas', 'refresh']"></fa-icon>
<fa-icon [icon]="['fas', 'info-circle']"></fa-icon>

<!-- ✅ CORRECT - Opening/closing tags when there is content -->
<div class="container">
  <fa-icon [icon]="['fas', 'refresh']" />
  <span class="ml-2">Check for Updates</span>
</div>
```

## Important Agent Guidelines

### NEVER run lint commands

- Lint is run automatically by the CI/CD pipeline
- DO NOT run `npm run lint`, `ng lint`, or any linting commands manually
- Code quality is enforced through automated processes

### NEVER use git commands unless explicitly requested

- DO NOT create commits (`git commit`, `git add`, etc.)
- DO NOT push changes to remote repositories
- DO NOT create branches, merge, or perform any git operations
- Only use git commands when the user explicitly requests them
- Let the user handle version control operations

Remember: Focus on code implementation and let automated systems handle linting and manual processes handle version control.
