# Taxman

Taxman is a command-line tool developed in TypeScript that integrates with the Stripe API to manage and export customer subscription data.

## Features

- Exports Stripe subscription data to a CSV file
- Supports filtering by subscription status (`active` or `past_due`)
- Implements pagination to handle large data volumes
- Maintains a cursor to allow resuming interrupted exports
- Integrates customer data with subscription information
- Processes customer data from generated CSV files

## Prerequisites

- [Bun](https://bun.sh) v1.1.34 or higher
- A Stripe API key
- Bun.js or Node.js with TypeScript (as dependencies)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Create a `.env` file in the project root and add your Stripe key:

```
STRIPE_SECRET_KEY=your_secret_key_here
```

## Usage

The tool supports multiple commands for different operations:

### Generate CSV

Export customer subscription data to a CSV file:

```bash
# To export active subscriptions
bun index.ts generate-csv active

# To export past due subscriptions
bun index.ts generate-csv past_due
```

### Process Customers

Process customers from the generated CSV file:

```bash
bun index.ts process-customers
```

### Development Mode

For development, you can use watch mode which automatically restarts the script when changes are detected:

```bash
bun run dev generate-csv active
```

## Generated Files

- `customers.csv`: CSV file containing customer data and their subscriptions
- `cursor.txt`: File that stores the cursor of the last export to allow resuming

## Project Structure

- `index.ts`: Main script file
- `commands/`: Directory containing command implementations
  - `generate-csv.command.ts`: Command for generating CSV files
  - `process-customers.command.ts`: Command for processing customer data
- `services/`: Directory containing service implementations
- `package.json`: Project settings and dependencies
- `.env`: Environment configuration (not versioned)

## Main Dependencies

- `stripe`: Stripe API integration
- `papaparse`: CSV file handling
- `dotenv`: Environment variable management
- `exceljs`: Excel file handling

## Development

This project was created using `bun init` in bun v1.1.34. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
