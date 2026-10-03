# Rahim's Spellbook Project: Flag Review

Flag Review checks a contract's wording against the law of a US state or Canadian province. It highlights passages that may be weak, ambiguous, or inconsistent, and suggests a rewording for each one. Where a specific statute or code section supports the change, it also gives a citation.

It is a wording review tool, not legal advice. Every citation is AI-generated and must be verified before it is relied on.

## How it works

1. **Jurisdiction.** The user picks a country and a state or province.
2. **Contract.** The user pastes text or uploads a PDF or PNG. Text-based PDFs are read locally with `pdfjs-dist`. Scanned PDFs and images are read by the AI model.
3. **Review.** The backend sends the contract and the jurisdiction to the model, which returns issues. Each issue is checked against a strict shape and retried with corrective feedback if it doesn't match.
4. **Edit and decide.** The contract is editable, with highlights that follow the text as it changes. Accepting a suggestion replaces the passage. Dismissing leaves it as is.
5. **Download.** The updated contract can be downloaded as a PDF.

The server stores nothing. The browser holds the review state and sends it with each request, so a server restart or a new deployment never leaves contract text behind.

## Architecture

```
frontend/   React + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui
backend/    Express + TypeScript
api/        Vercel entry point that runs the backend as a serverless function
```

Backend layout:

| Path                               | Purpose                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `src/app.ts`                       | Express app: routes, rate limit, and body-size limit               |
| `src/routes/reviews.ts`            | Review, sync, accept, and PDF endpoints                            |
| `src/routes/extract.ts`            | Upload endpoint for PDF and PNG text extraction                    |
| `src/services/llm.ts`              | AI provider layer: Claude (default), Gemini, or Groq, with retries |
| `src/services/analyzeDocument.ts`  | Prompt, model call, and validation with retry-on-feedback          |
| `src/services/validateLlmIssue.ts` | Checks each issue's shape and reports specific errors              |
| `src/services/locateQuote.ts`      | Finds where each quoted passage sits in the text                   |
| `src/services/relocateIssues.ts`   | Re-locates pending issues after the text is edited                 |
| `src/services/applySuggestion.ts`  | Applies a suggestion and shifts the other highlights               |
| `src/services/extractText.ts`      | PDF text layer and AI fallback for scans and images                |
| `src/services/exportPdf.ts`        | Builds the downloadable PDF                                        |

## Running it locally

Requirements: Node.js 22 (the version this was built and tested with), and an API key for at least one AI provider.

```bash
npm install
cp backend/.env.example backend/.env   # then fill in your keys
npm run dev -w backend                 # API on http://localhost:4000
npm run dev -w frontend                # app on http://localhost:5173
```

Settings in `backend/.env`:

| Variable                            | Purpose                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| `LLM_PROVIDER`                      | `anthropic` (default in the example), `gemini`, or `groq`      |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | Claude settings                                                |
| `ANTHROPIC_WORKSPACE_ID`            | Only needed if the key is not tied to a workspace              |
| `GEMINI_API_KEY`                    | Gemini settings. Gemini can also read scanned PDFs and images. |
| `GROQ_API_KEY`                      | Groq settings. Groq is text only.                              |

## Tests

```bash
npm test -w backend
```

The tests cover quote location, applying suggestions, re-locating issues after edits, and validating model output.

## Deployment

The app is deployed on Vercel. `vercel.json` builds the frontend into `frontend/dist`, and routes `/api` requests to the Express app in `api/index.ts`. Set the same variables as in `.env` in the Vercel project settings.

Vercel limits request bodies to about 4.5 MB, so uploads are capped at 3 MB. Reviews can take 10 to 20 seconds, so the function timeout is set to 60 seconds, which requires a plan that allows it.

## Privacy

Contract text is sent to the AI provider you configure, and nowhere else. The application server does not store contract text or log it.

## Known limitations

- Citations come from the model's own knowledge. They are not checked against a statute database.
- The downloaded PDF is plain text. It does not keep the original formatting, fonts, or layout.
- Standard PDF fonts cover Western European characters only.
- Refreshing the page loses the current review, because nothing is stored on the server.
