# Testing Guide

## Setup

Install dependencies:
```bash
pnpm install
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

Tests are located in `src/**/__tests__/*.test.ts` files.

### Current Test Coverage

- ✅ Dashboard API test structure created
- 🔄 Tests are placeholders - need implementation

### Priority Tests to Implement

1. **Plan Purchase Flow** (CRITICAL)
   - Test successful purchase with sufficient balance
   - Test rejection with insufficient balance
   - Test transaction rollback on failure
   - Test monthly purchase limit enforcement
   - Test rate limiting

2. **Top-up Approval** (HIGH)
   - Test atomic balance update
   - Test transaction rollback on failure

3. **Authentication** (MEDIUM)
   - Test login/register flows
   - Test JWT token validation

## Next Steps

1. Set up test database (separate from production)
2. Create test fixtures and helpers
3. Implement placeholder tests
4. Add CI/CD integration
5. Aim for 80% code coverage on critical paths

## Notes

- Tests use Jest with ts-jest for TypeScript support
- ESM modules are enabled
- Coverage threshold set to 50% (increase gradually)
