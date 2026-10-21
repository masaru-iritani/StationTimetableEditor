# AI Agent Guidelines

Every time the user asks for a code change, you must create a git commit for those changes. 

When creating the commit:
1. The first paragraph of the commit message must be the exact prompt provided by the user.
2. Each commit must include a co-authored trailer indicating it was co-authored by the AI agent. Use `Co-authored-by: <Agent Name> <ai@example.com>`, replacing `<Agent Name>` with your actual agent name.

## Versioning

Every time you make a code change, you must increment the application version. To do this:
1. Locate the version file or version constant in the project (e.g., `package.json`, `version.py`, `AssemblyInfo.cs`, or similar).
2. Increment the **patch** version (the third number in `MAJOR.MINOR.PATCH`) for bug fixes and small changes, the **minor** version (second number) for new features, and the **major** version (first number) for breaking changes.
3. Include the version file change in the same commit as the code change.
