import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const oldVersion = pkg.version;

console.log(`Current version: ${oldVersion}`);

// Helper to calculate next versions
const [major, minor, patch] = oldVersion.split('.').map(Number);
const nextPatch = `${major}.${minor}.${patch + 1}`;
const nextMinor = `${major}.${minor + 1}.0`;
const nextMajor = `${major + 1}.0.0`;

console.log(`
Select release type:
1. patch (${nextPatch})
2. minor (${nextMinor})
3. major (${nextMajor})
4. manual
`);

const choice = prompt('Choice (1-4):');
let newVersion: string | null = '';

switch (choice) {
  case '1':
    newVersion = nextPatch;
    break;
  case '2':
    newVersion = nextMinor;
    break;
  case '3':
    newVersion = nextMajor;
    break;
  case '4':
    newVersion = prompt('Enter new version:');
    break;
  default:
    console.log('Invalid choice. Aborted.');
    process.exit(1);
}

if (!newVersion) {
  console.log('Aborted.');
  process.exit(1);
}

const confirmVersion = prompt(`\nUpdate all files to version ${newVersion}? (Y/n)`, 'y');
if (confirmVersion?.toLowerCase() === 'n') {
  console.log('Aborted.');
  process.exit(1);
}

// 1. Update package.json
pkg.version = newVersion;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// 2. Update app/package.json
const appPkgPath = path.join(process.cwd(), 'app/package.json');
try {
  const appPkg = JSON.parse(readFileSync(appPkgPath, 'utf-8'));
  appPkg.version = newVersion;
  writeFileSync(appPkgPath, `${JSON.stringify(appPkg, null, 2)}\n`);
} catch (_e) {
  console.warn('Could not update app/package.json');
}

console.log('✅ Files updated.');

// 3. Commit
const confirmCommit = prompt(`\nCommit changes with message "chore: release v${newVersion}"? (Y/n)`, 'y');
if (confirmCommit?.toLowerCase() !== 'n') {
  execSync('git add package.json app/package.json');
  execSync(`git commit -m "chore: release v${newVersion}"`);
  console.log('✅ Committed.');
} else {
  console.log('Aborted.');
  process.exit(1);
}

// 4. Push Commit
const confirmPush = prompt('\nPush commit to remote? (Y/n)', 'y');
if (confirmPush?.toLowerCase() !== 'n') {
  try {
    execSync('git push');
    console.log('✅ Pushed.');
  } catch (_e) {
    console.error('❌ Push failed, but continuing...');
  }
} else {
  console.log('Push skipped.');
}

// 5. Tag
const confirmTag = prompt(`\nCreate git tag v${newVersion}? (Y/n)`, 'y');
if (confirmTag?.toLowerCase() !== 'n') {
  execSync(`git tag v${newVersion}`);
  console.log('✅ Tag created.');
} else {
  console.log('Aborted.');
  process.exit(1);
}

// 6. Push Tag
const confirmPushTag = prompt(`\nPush tag v${newVersion} to remote? (Y/n)`, 'y');
if (confirmPushTag?.toLowerCase() !== 'n') {
  try {
    execSync('git push --tags');
    console.log('✅ Tags pushed.');
  } catch (_e) {
    console.error('❌ Tag push failed.');
  }
} else {
  console.log('Tag push skipped.');
}

console.log(`\n🎉 Release v${newVersion} finished!`);
console.log(`\nℹ️  GitHub Actions will automatically build and publish the release when the tag is pushed.`);
