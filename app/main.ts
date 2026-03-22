import { bootstrapApplication } from './bootstrap/application';

const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');
const test = args.some((val) => val === '--test') || process.env.ELECTRON_IS_TEST === 'true';

try {
  bootstrapApplication(serve, test);
} catch (error) {
  console.error('Failed to bootstrap application:', error);
}
