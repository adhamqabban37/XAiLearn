/**
 * Jest setup for DOM matchers
 * Use CommonJS require to avoid ESM parsing issues in Jest
 */
require("@testing-library/jest-dom");

// Increase timeout for Firestore emulator operations
jest.setTimeout(30000);

// Provide dummy Supabase env vars for tests
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "test-anon-key";

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
//   log: jest.fn(),
// };
