# Contributing to CyberWatch

Thank you for your interest in contributing to CyberWatch!

## Getting Started

1. Fork the repository.
2. Clone your fork locally.
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes.
5. Run tests: `cd backend && pytest`
6. Commit with a clear message: `git commit -m "feat: add your feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request.

## Development Setup

See the [README.md](README.md) for full setup instructions.

## Code Standards

### Backend (Python)
- Follow PEP 8.
- Use type hints for all function signatures.
- Write docstrings for public functions and classes.
- Add tests for new features in `backend/tests/`.

### Frontend (TypeScript/React)
- Use TypeScript strict mode.
- Create reusable components.
- Follow the existing dark theme design system.
- Handle loading, error, and empty states.

## Reporting Issues

- Use GitHub Issues.
- Include steps to reproduce.
- Include your OS, Python version, and Node.js version.

## Security

- **Never** commit API keys, credentials, or `.env` files.
- Report security vulnerabilities privately — do not open public issues.
- See [SECURITY.md](SECURITY.md) if available.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
