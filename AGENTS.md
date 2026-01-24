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

- **Always use separate files** for Angular components:
  - `component-name.component.ts` - TypeScript class
  - `component-name.component.html` - Template
  - `component-name.component.css` - Styles (when needed)
- **Never use inline templates or styles** in the component decorator

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
