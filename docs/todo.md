# TODO - AyAIs v0.2.0

This document contains a comprehensive analysis of potential improvements, bugs, and enhancements for the AyAIs application.

Last updated: 2025-01-31

---

## Current Strengths

- Modern architecture (Angular 21 + latest Electron)
- Well-structured codebase
- Unit tests present (15 spec files)
- Excellent documentation (AGENTS.md)
- Sophisticated keyboard shortcut handling (AZERTY/QWERTY, Mac/Windows/Linux)
- Modular design with well-separated services

---

## High Priority (Security, Stability, UX)

### 1. User Error Handling

- **Issue**: Many silent `.catch(() => {})` blocks in main.ts and services
- **Impact**: Errors are invisible to users
- **Locations**: main.ts:58-59, 69-71, 98-99, 220-222, etc.
- **Solution**: Implement a toast notification system to inform users of errors

### 2. Unsani tized JavaScript Injection in Webviews

- **Issue**: webview.service.ts:52-125 injects JS code directly via `executeJavaScript()`
- **Risk**: If an AI service is compromised, could execute malicious code
- **Solution**: Validate/escape injected code, use CSP headers

### 3. Fragile IPC Communication via console.log

- **Issue**: webview.service.ts uses `console.log('AYAIS_SHORTCUT:')` for communication
- **Risk**: Breaks if AI services modify console behavior
- **Solution**: Use `ipcRenderer` or `postMessage` with a clean API

### 4. No Webview Cleanup

- **Issue**: home.component.ts creates webviews but never cleans them up
- **Risk**: Memory leak if user navigates between many services
- **Locations**: home.component.ts:80-85
- **Solution**: Implement `ngOnDestroy()` to remove unused webviews

### 5. Missing Configuration Validation

- **Issue**: main.ts:23 parses JSON without checking structure
- **Risk**: App crash if config.json is corrupted
- **Solution**: Use zod or schema validation

### 6. Undocumented Magic Numbers

- **Issue**: `setTimeout(..., 400)` in main.ts:437, `SHORTCUT_DEBOUNCE_MS = 100`
- **Impact**: Unclear behavior, hard to maintain
- **Solution**: Extract to named constants with comments

### 7. No Loading States

- **Issue**: No visual indication during webview loading
- **UX Impact**: Users don't know if the app is working
- **Solution**: Add spinners/skeletons

---

## Medium Priority (Maintainability, Performance)

### 8. French Comments in English Code

- **Issue**: main.ts:91, 94, 97, 105, 429 contain French comments
- **Violation**: AGENTS.md states "Code: Exclusively in English"
- **Locations**: main.ts:91, 94, 97, 105, 429
- **Solution**: Translate all comments to English

### 9. ShortcutManager Service Too Large

- **Issue**: 396 lines, manages too many responsibilities
- **Difficulty**: Complex tests, hard-to-follow logic
- **Solution**: Extract `ShortcutValidator`, `ShortcutFormatter`, `ShortcutExecutor` into separate services

### 10. No Lazy Loading for Webviews

- **Issue**: All webviews created on first selection
- **Performance**: Increases memory usage at startup
- **Locations**: home.component.ts:80-85
- **Solution**: Create webviews on-demand, destroy unused ones

### 11. Duplicate Platform Detection

- **Issue**: `isMac` detected in both ShortcutManagerService and WebviewService
- **Duplication**: Identical logic in two services
- **Locations**: shortcut-manager.service.ts:16, webview.service.ts:12
- **Solution**: Create shared `PlatformService`

### 12. No Main Process Tests

- **Issue**: No tests for app/main.ts, app/preload.ts
- **Risk**: Possible regressions on core functionality
- **Solution**: Add tests with `electron-mocha` or `spectron`

### 13. Scattered State Management

- **Issue**: Config in main.ts, shortcuts in ShortcutManagerService, editing state in ShortcutManagerService
- **Complexity**: Hard to track global application state
- **Solution**: Consider centralized state management (signals, NgRx, or dedicated service)

### 14. No Undo/Redo for Shortcuts

- **Issue**: If user makes a shortcut mistake, no way to go back
- **UX Impact**: Frustrating if accidentally deleting a shortcut
- **Solution**: Add undo system or confirm modifications

### 15. Dead/Unused Code

- **Issue**: Some imports and properties may be unused
- **Example**: `protected readonly isAiServicesRoute` in home.component.ts:39
- **Solution**: Audit with linter and remove unused code

---

## Low Priority (Enhancements, Features)

### 16. Dark Mode Not Exposed

- **Issue**: Dark theme exists but not user-configurable
- **Locations**: AGENTS.md mentions "Light, dark, and auto themes"
- **Solution**: Add setting in settings.component.ts

### 17. No Analytics/Telemetry

- **Issue**: Impossible to know how users use the app
- **Solution**: Add PostHog or Plausible (opt-in)

### 18. No Auto-Update

- **Issue**: Users must download updates manually
- **Issue**: electron-builder configured but autoUpdate not implemented
- **Solution**: Implement `electron-updater`

### 19. No Error Boundary

- **Issue**: If unhandled Angular error occurs, entire UI crashes
- **Solution**: Create ErrorBoundary component to catch errors

### 20. Minimal E2E Tests

- **Issue**: Only 1 E2E test file detected
- **Solution**: Add test scenarios for critical flows

### 21. No Confirmation for Destructive Actions

- **Issue**: Quitting app, changing global shortcut = no confirmation
- **Solution**: Add confirmation modals

### 22. Missing Inline Documentation

- **Issue**: Some complex functions lack JSDoc
- **Examples**: `buildShortcutString()`, `handleShortcutFromWebview()`
- **Solution**: Add JSDoc for complex public functions

### 23. No Debug Logs

- **Issue**: Impossible to easily debug user issues
- **Solution**: Add logging system with levels (debug, info, warn, error)

### 24. No Interface for Delay Constants

- **Issue**: `SHORTCUT_DEBOUNCE_MS = 100` hardcoded
- **Solution**: Move to configuration file

### 25. Service Shortcuts Handled by Index

- **Issue**: home.component.ts:381 uses `parseInt(id.replace('service', ''), 10) - 1`
- **Fragile**: Breaks if ID format changes
- **Solution**: Pass index directly in config

---

## Current Metrics

| Metric                       | Value                   | Comment                     |
| ---------------------------- | ----------------------- | --------------------------- |
| Unit tests                   | 15 files                | Good                        |
| E2E tests                    | 1 file                  | Should improve              |
| main.ts lines                | 546                     | A bit long                  |
| ShortcutManagerService lines | 396                     | Too many responsibilities   |
| Outdated dependencies        | RxJS 7.8 (v8 available) | Should update               |
| Test coverage                | ?                       | Not visible in package.json |

---

## Recommended Starting Points

If prioritizing the first 5 changes:

1. **User error handling** (Critical UX)
2. **Configuration validation** (Security/stability)
3. **Webview cleanup** (Memory leak)
4. **Translate French comments** (Follow standards)
5. **Shared platform service** (Simple refactor that improves maintainability)

---

## Current Bugs (fix-0.2.0-bugs branch)

### Shortcut Execution During Editing

- **Files**: home.component.ts, shortcut-manager.service.ts
- **Bug**: Shortcuts executing even when editing shortcuts in settings
- **Fix**: Added `canExecuteInternalShortcuts()` check before execution
- **Status**: Fixed, needs testing

---

## Technical Debt Summary

- **Security**: 3 issues (JS injection, IPC fragility, no config validation)
- **Performance**: 2 issues (no lazy loading, memory leaks)
- **Maintainability**: 6 issues (large services, duplicate code, scattered state)
- **UX**: 4 issues (no error feedback, no loading states, no undo/redo, no confirmations)
- **Testing**: 2 issues (no main process tests, minimal E2E coverage)
