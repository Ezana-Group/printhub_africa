/**
 * Remove test records after a test.
 * Option 1: Run tests against a dedicated test DB and reset between runs (e.g. db:push or migrate).
 * Option 2: Add a test-only API that deletes records by marker (e.g. projectName starting with "E2E ").
 * Option 3: Use Prisma in a global teardown script that connects with DATABASE_URL from .env.test.
 *
 * For now this is a no-op. Configure one of the options above or implement a small script:
 *   npx tsx scripts/cleanup-test-data.ts
 * that runs after test:all and deletes Quote where projectName like 'E2E %'.
 */
export async function cleanupTestData(): Promise<void> {
  // No-op. Implement with test DB reset or test-only delete API if needed.
}
