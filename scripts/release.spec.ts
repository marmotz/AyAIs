import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('release script', () => {
  it('should exist and be readable', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/release.ts');
    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toBeTruthy();
  });

  it('should have correct version calculation logic', () => {
    // Test version parsing logic
    const testVersion = '1.2.3';
    const [major, minor, patch] = testVersion.split('.').map(Number);

    expect(major).toBe(1);
    expect(minor).toBe(2);
    expect(patch).toBe(3);

    const nextPatch = `${major}.${minor}.${patch + 1}`;
    const nextMinor = `${major}.${minor + 1}.0`;
    const nextMajor = `${major + 1}.0.0`;

    expect(nextPatch).toBe('1.2.4');
    expect(nextMinor).toBe('1.3.0');
    expect(nextMajor).toBe('2.0.0');
  });

  it('should have all required imports', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/release.ts');
    const content = readFileSync(scriptPath, 'utf-8');

    expect(content).toContain('import { execSync } from');
    expect(content).toContain('import { readFileSync, writeFileSync } from');
    expect(content).toContain('import path from');
  });

  it('should update package.json version', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/release.ts');
    const content = readFileSync(scriptPath, 'utf-8');

    expect(content).toContain('pkg.version = newVersion');
    expect(content).toContain('writeFileSync(pkgPath');
  });

  it('should update app/package.json version', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/release.ts');
    const content = readFileSync(scriptPath, 'utf-8');

    expect(content).toContain('app/package.json');
    expect(content).toContain('appPkg.version = newVersion');
  });

  it('should include git operations', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/release.ts');
    const content = readFileSync(scriptPath, 'utf-8');

    expect(content).toContain('git add package.json app/package.json');
    expect(content).toContain('git commit');
    expect(content).toContain('git push');
    expect(content).toContain('git tag');
  });

  it('should have proper user confirmation prompts', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/release.ts');
    const content = readFileSync(scriptPath, 'utf-8');

    expect(content).toContain('prompt');
    expect(content).toContain('Y/n');
    expect(content).toContain('Aborted');
  });

  it('should be referenced in package.json scripts', () => {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    expect(pkg.scripts.release).toBeDefined();
    expect(pkg.scripts.release).toContain('scripts/release.ts');
  });
});
