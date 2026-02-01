import { bootstrapApplication } from './bootstrap/application';

const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');

try {
  bootstrapApplication(serve);
} catch (error) {
  console.error('Failed to bootstrap application:', error);
}
