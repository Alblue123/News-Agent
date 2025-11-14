# Mastra AI News Workflow

A Mastra AI-powered news processing workflow that extracts, analyzes, and generates reports from news articles.

## Features

- **News Extraction**: Extract content from news articles using specialized tools
- **Technology Analysis**: Identify and analyze technology-related content in news articles
- **Multi-Agent Workflow**: Coordinated workflow between news, reporter, and writer agents
- **Report Generation**: Generate comprehensive reports from processed news content

## Project Structure

```
news-mastra/
├── src/
│   └── mastra/
│       ├── agents/
│       │   ├── news-agent.ts      # Handles news article processing
│       │   ├── reporter-agent.ts  # Generates reports from processed data
│       │   └── writer-agent.ts    # Writes and formats content
│       ├── tools/
│       │   ├── news-extract-tool.ts    # Extracts news content
│       │   └── tech-extract-tool.ts    # Extracts technology information
│       ├── workflows/
│       │   └── news-workflow.ts   # Main workflow orchestration
│       └── index.ts               # Main entry point
├── .env                          # Environment variables
├── package.json                  # Project dependencies
└── mastra.db                     # Database file
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd news-mastra
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Usage

To run the news workflow:

```bash
npm start
```

## Agents

### News Agent
- Processes incoming news articles
- Extracts relevant information and metadata
- Coordinates with other agents in the workflow

### Reporter Agent
- Analyzes processed news data
- Identifies key insights and trends
- Structures information for report generation

### Writer Agent
- Generates human-readable reports
- Formats content for different output types
- Ensures quality and coherence of final output

## Tools

### News Extract Tool
- Extracts content from various news sources
- Handles different article formats
- Cleans and normalizes text content

### Tech Extract Tool
- Identifies technology-related content
- Extracts technical specifications
- Categorizes technology topics

## Workflow

The news workflow orchestrates the entire process:

1. **Input**: Receives news articles or URLs
2. **Extraction**: Uses news and tech extract tools to gather information
3. **Processing**: Agents analyze and structure the extracted data
4. **Generation**: Writer agent creates final reports
5. **Output**: Delivers processed reports in desired format

## Configuration

Configure your environment variables in `.env`:

```env
# Add your API keys and configuration here
API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.