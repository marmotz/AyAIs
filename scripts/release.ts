import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

function confirm(message: string): boolean {
  const answer = prompt(`${message} (Y/n)`, 'y');

  return answer?.toLowerCase() !== 'n';
}

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const oldVersion = pkg.version;

console.log(`Current version: ${oldVersion}`);

// 1. Git Branch Management: Switch to main
const currentBranch = execSync('git branch --show-current').toString().trim();
if (currentBranch !== 'main') {
  if (confirm(`Currently on ${currentBranch}. Switch to main and pull?`)) {
    execSync('git checkout main');
    execSync('git pull');
    console.log('✅ Switched to main and pulled.');
  } else {
    console.log('Aborted.');
    process.exit(1);
  }
} else {
  if (confirm('On main branch. Pull latest changes?')) {
    execSync('git pull');
    console.log('✅ Pulled latest changes.');
  }
}

// 2. Merge develop into main
if (confirm('Merge develop into main?')) {
  try {
    execSync('git merge develop');
    console.log('✅ develop merged into main.');
  } catch (e) {
    console.error('❌ Merge failed. Please resolve conflicts manually.');
    process.exit(1);
  }
} else {
  console.log('Merge skipped.');
}

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

if (!confirm(`\nUpdate all files to version ${newVersion}?`)) {
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
if (confirm(`\nCommit changes with message "chore: release v${newVersion}"?`)) {
  execSync('git add package.json app/package.json');
  execSync(`git commit -m "chore: release v${newVersion}"`);
  console.log('✅ Committed.');
} else {
  console.log('Aborted.');
  process.exit(1);
}

// 4. Push Commit
if (confirm('\nPush commit to remote?')) {
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
if (confirm(`\nCreate git tag v${newVersion}?`)) {
  execSync(`git tag v${newVersion}`);
  console.log('✅ Tag created.');
} else {
  console.log('Aborted.');
  process.exit(1);
}

// 6. Push Tag
if (confirm(`\nPush tag v${newVersion} to remote?`)) {
  try {
    execSync('git push --tags');
    console.log('✅ Tags pushed.');
  } catch (_e) {
    console.error('❌ Tag push failed.');
  }
} else {
  console.log('Tag push skipped.');
}

// 7. Merge back to develop
if (confirm('\nReturn to develop and merge main (merge back)?')) {
  execSync('git checkout develop');
  execSync('git merge main');
  console.log('✅ main merged back into develop.');

  if (confirm('Push develop to remote?')) {
    try {
      execSync('git push');
      console.log('✅ develop pushed.');
    } catch (_e) {
      console.error('❌ Push failed.');
    }
  }
}

console.log(`\n🎉 Release v${newVersion} finished!`);
console.log(`\nℹ️  GitHub Actions will automatically build and publish the release when the tag is pushed.`);
