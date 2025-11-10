# CryptoDevTeam Crew

Welcome to the CryptoDevTeam Crew project, powered by [crewAI](https://crewai.com). This is a hierarchical multi-agent AI system designed to develop and maintain a cryptocurrency wallet application. The crew consists of 1 Project Manager and 6 specialist agents who work together to analyze, implement, secure, test, and design your crypto wallet codebase.

## Installation

Ensure you have Python >=3.10 <3.14 installed on your system. This project uses [UV](https://docs.astral.sh/uv/) for dependency management and package handling, offering a seamless setup and execution experience.

First, if you haven't already, install uv:

```bash
pip install uv
```

Next, navigate to your project directory and install the dependencies:

(Optional) Lock the dependencies and install them by using the CLI command:
```bash
crewai install
```
### Customizing

**Add your `ANTHROPIC_API_KEY` into the `.env` file** (The crew uses Claude Sonnet 4)

**Update the target project path:**
- Edit `src/crypto_dev_team/crew.py` and update `project_path` to point to your crypto wallet project
- **IMPORTANT:** Copy `PROJECT_STRUCTURE.md` to the root of your wallet project (e.g., `your-hi-engine/PROJECT_STRUCTURE.md`)
- Update the copied `PROJECT_STRUCTURE.md` to match your actual project structure

**Optional customizations:**
- Modify `src/crypto_dev_team/config/agents.yaml` to adjust agent roles or add new specialists
- Modify `src/crypto_dev_team/config/tasks.yaml` to change delegation rules
- Modify `src/crypto_dev_team/crew.py` to adjust max iterations or add tools
- Modify `src/crypto_dev_team/main.py` to customize the CLI interface

## Running the Project

To kickstart your crew of AI agents and begin task execution, run this from the root folder of your project:

```bash
$ crewai run
```

This will launch an interactive prompt where you can enter your request. The Project Manager will then:
1. Analyze your request
2. Break it down into subtasks
3. Delegate to appropriate specialists
4. Review their work
5. Present a comprehensive report

### Example Requests

**Good examples (specific):**
```bash
crewai run "Find bugs in the wallet balance fetching logic"
crewai run "Review security of private key handling in hdWallet.ts"
crewai run "Create database schema for transaction history"
crewai run "Write tests for the send transaction flow"
crewai run "Build a responsive transaction history UI component"
crewai run "Implement Supabase RLS policies for user wallets"
```

**Bad examples (too vague):**
```bash
crewai run "Check everything"
crewai run "Make it better"
```

The crew works best with specific, targeted requests that clearly state WHAT needs to be done and WHERE.

## Understanding Your Crew

### Team Structure

**Manager:**
- **Project Manager** - Coordinates all work, delegates to specialists, reviews outputs

**Specialists:**
- **Code Analyzer** - Finds bugs, performance issues, code quality problems
- **Code Implementer** - Builds features, fixes bugs, writes production code
- **Database Architect** - Designs schemas, migrations, Edge Functions, RLS policies
- **Security Specialist** - Reviews crypto wallet security, private key handling, auth flows
- **QA Tester** - Writes comprehensive tests (unit, integration, E2E)
- **UI Designer** - Builds beautiful, responsive React components with Tailwind CSS

### Project Structure Documentation

**IMPORTANT:** The crew references `PROJECT_STRUCTURE.md` which documents:
- Complete file structure of the crypto wallet project
- Security-critical files that need priority review
- Database schema and migration files
- Testing structure and patterns
- Where to place new code

All agents are configured to check `PROJECT_STRUCTURE.md` first to understand:
- Which files to analyze or modify
- Where to create new files
- What the existing architecture looks like
- Testing and security patterns

### Configuration Files

- `src/crypto_dev_team/config/agents.yaml` - Agent roles, goals, and backstories
- `src/crypto_dev_team/config/tasks.yaml` - Task definitions and delegation rules
- `src/crypto_dev_team/crew.py` - Agent initialization and crew setup
- `src/crypto_dev_team/main.py` - CLI interface for running tasks
- `PROJECT_STRUCTURE.md` - Complete documentation of target project structure

## Support

For support, questions, or feedback regarding the CryptoDevTeam Crew or crewAI.
- Visit our [documentation](https://docs.crewai.com)
- Reach out to us through our [GitHub repository](https://github.com/joaomdmoura/crewai)
- [Join our Discord](https://discord.com/invite/X4JWnZnxPb)
- [Chat with our docs](https://chatg.pt/DWjSBZn)

Let's create wonders together with the power and simplicity of crewAI.
