import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

const args = ['build', '-c', 'electron-builder.json'];

if (version.includes('beta')) {
  args.push('--config.publish.channel=beta');
} else if (version.includes('alpha')) {
  args.push('--config.publish.channel=alpha');
}

args.push('--publish=never');

console.log(
  `Building version ${version} with channel: ${version.includes('beta') ? 'beta' : version.includes('alpha') ? 'alpha' : 'latest'}`
);

try {
  execSync(`electron-builder ${args.join(' ')}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
