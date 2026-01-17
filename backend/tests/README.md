# Email Scraping Validation Test Suite

Comprehensive test suite for validating the JobFetch/CareerPulse email scraping functionality with **311+ passing tests**.

## 📊 Test Coverage

- **Unit Tests**: 125+ tests for individual functions
- **Property-Based Tests**: 45+ tests with 2,500+ randomized iterations  
- **Total**: 311+ tests passing

## 🚀 Running Tests

```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:properties    # Property-based tests only
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode
```

## 🏗️ Test Structure

```
tests/
├── unit/              # Unit tests (125+ tests)
├── properties/        # Property-based tests (45+ tests)
├── helpers/           # Test utilities
└── fixtures/          # Test data (68 emails)
```

## ✅ Coverage Goals

- Statements: 90%+
- Branches: 85%+
- Functions: 95%+
- Lines: 90%+

## 📚 Documentation

See full documentation in this file for:
- Test categories and structure
- Helper utilities
- Writing new tests
- Debugging tips
- CI/CD integration

**Related Docs:**
- [Design](.kiro/specs/email-scraping-validation/design.md)
- [Requirements](.kiro/specs/email-scraping-validation/requirements.md)
- [Tasks](.kiro/specs/email-scraping-validation/tasks.md)
