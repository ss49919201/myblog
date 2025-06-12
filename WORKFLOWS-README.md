# GitHub Actions Workflows

This directory contains GitHub Actions workflow files for automated CI/CD pipelines.

## Workflow Files

### 1. CI Workflow (`ci.yml`)
**Purpose**: Main continuous integration pipeline for code quality and testing.

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs**:
- **Backend CI**: 
  - Go linting with golangci-lint
  - Unit and integration tests with MySQL service
  - TypeSpec compilation and OpenAPI code generation
  - Build verification
- **Frontend CI**:
  - ESLint linting
  - TypeScript type checking
  - Next.js build verification
- **Security Checks**:
  - Go security scanning with gosec
  - NPM audit for vulnerability detection

### 2. CodeQL Security Analysis (`codeql.yml`)
**Purpose**: Advanced security analysis using GitHub's CodeQL engine.

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly schedule (Monday 1:30 AM UTC)

**Languages Analyzed**:
- Go (backend)
- JavaScript/TypeScript (frontend)


## Setup Instructions

1. **Create the workflows directory**:
   ```bash
   mkdir -p .github/workflows/
   ```

2. **Copy workflow files**:
   ```bash
   cp .github-workflows-ci.yml .github/workflows/ci.yml
   cp .github-workflows-codeql.yml .github/workflows/codeql.yml
   ```

3. **Remove the temporary files**:
   ```bash
   rm .github-workflows-*.yml
   rm WORKFLOWS-README.md
   ```

4. **Commit the workflows**:
   ```bash
   git add .github/workflows/
   git commit -m "feat: add GitHub Actions CI/CD workflows"
   ```

## Configuration Requirements

### Repository Settings
- Enable GitHub Actions in repository settings

### Optional Secrets
- No additional secrets required for basic functionality
- For enhanced security scanning, consider adding:
  - `SONAR_TOKEN` for SonarCloud integration
  - Custom security scanning tokens

## Workflow Features

### Performance Optimizations
- **Caching**: Go modules and NPM dependencies are cached
- **Parallel Jobs**: Frontend and backend CI run in parallel
- **Conditional Steps**: Expensive operations only run when necessary

### Quality Gates
- **Linting**: Both Go and JavaScript/TypeScript linting
- **Type Safety**: TypeScript compilation checks
- **Security**: Multiple security scanning tools
- **Build Verification**: Ensures applications build successfully

### Database Testing
- **MySQL Service**: Integration tests run against real MySQL instance
- **Schema Initialization**: Database schema is automatically applied
- **Connection Testing**: Health checks ensure database availability

## Maintenance

### Adding New Checks
1. Edit the appropriate workflow file
2. Add new steps or jobs as needed
3. Test with a pull request
4. Update this documentation

### Modifying Dependencies
- Go dependencies: Update `go.mod` and let CI verify
- NPM dependencies: Update `package.json` files and let CI verify
- Action versions: Use Dependabot or manual updates

### Troubleshooting
- Check workflow logs in the Actions tab
- Verify environment variables and secrets
- Ensure required permissions are granted
- Review database connectivity for integration tests

## Best Practices

1. **Keep workflows fast**: Use caching and parallel execution
2. **Security first**: Regular dependency updates and security scanning
3. **Clear naming**: Descriptive job and step names
4. **Documentation**: Update this README when adding new workflows
5. **Testing**: Verify workflow changes with pull requests