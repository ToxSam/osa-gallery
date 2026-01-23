# Project Architecture

## Data Storage Architecture

This project uses a two-repository approach for enhanced security and maintainability:

### Main Application Repository (`osa-gallery`)

- Contains all application code and UI components
- Connects to the data repository via GitHub API
- Configuration via environment variables (see `.env.example`)

### Data Repository (`open-source-avatars`)

- Contains JSON data files organized by entity type
- Completely separate from application code
- Public read access, controlled write access
- Simple structure for community contributions

## Benefits of This Approach

- **Separation of Concerns**: Code and data are cleanly separated
- **Enhanced Security**: Sensitive configuration is isolated
- **Simplified Contributions**: Data can be updated without modifying code
- **Version Control**: All data changes are tracked through Git history
- **Transparency**: Public visibility of data structure and changes

## How to Set Up

1. Clone both repositories
2. Configure environment variables according to `.env.example`
3. Run the GitHub connection test to verify setup

See the developer documentation for more detailed instructions.

## Updating Data

Data changes are made through GitHub API calls from the application. Authorized users can:

1. Read data from the repository
2. Modify data through the application
3. Changes are committed back to the data repository

## Data Structure

The data is organized into several JSON files:

- `users.json` - User accounts (with sensitive data sanitized)
- `projects.json` - Projects containing avatars
- `avatars.json` - 3D avatar models
- `tags.json` - Searchable tags for categorization
- `avatar-tags.json` - Relationship mapping between avatars and tags
- `downloads.json` - Download statistics

## Contributing

Contributions to both code and data are welcome. See CONTRIBUTING.md for guidelines. 