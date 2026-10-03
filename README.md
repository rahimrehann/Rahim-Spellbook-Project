# Rahim's Spellbook Project

Flag Review checks a contract's wording against the law of a US state or Canadian province. It highlights passages that may be weak, ambiguous, or inconsistent and suggests a clearer rewording for each one. The Claude model also checks each change against the law of the selected jurisdiction, and where a statute or code section supports it, cites that authority on the suggestion card.

It is a wording review tool, not legal advice. The citations come from the model's own knowledge of the law, not from a legal database, so verify any citation before relying on it.

## How it works

1. **Choose a jurisdiction.** The user picks a country, then a state or province. The review is framed against that law.
2. **Add the contract.** The user pastes text or uploads a PDF or PNG. Text-based PDFs are read directly on the server. Scanned PDFs and images are read by the AI model.
3. **Review.** The model returns a list of issues. Each one contains the flagged passage, a summary, the reasoning, a suggested rewording, and a citation when the model finds one that supports the change. The citation appears on the suggestion card. The server checks every issue against a strict format, and if the model's answer doesn't match, it asks again with the specific error.
4. **Edit and decide.** The contract is editable, and the highlights stay on the right passages as the text changes. Accepting a suggestion replaces the passage. Dismissing leaves the wording as it is.
5. **Download.** When every issue is handled, the updated contract can be downloaded as a PDF.

## Architecture

The browser holds the whole review, the contract text and its issues, and sends it with each request. The server keeps nothing between requests, so contract text is never stored.

```
Browser (React, Vite, Tailwind, shadcn/ui)
   │  contract text + issues, sent with each request
   ▼
Express API (TypeScript)
   ├── Review: prompt, model call, format check, retry with feedback
   ├── Edit sync: re-finds each flagged passage after the text changes
   ├── Accept: applies a suggestion and shifts the remaining highlights
   ├── Upload: reads text-based PDFs locally, scans and images with the model
   └── PDF export: builds the updated contract
   │
   ▼
AI model (Claude by default; Gemini and Groq are also supported)
```

### Project layout

| Path                                       | What it holds                                                |
| ------------------------------------------ | ------------------------------------------------------------ |
| `frontend/src/components/StartPage.tsx`    | Jurisdiction choice and contract input                       |
| `frontend/src/components/ReviewPage.tsx`   | The editable contract and the suggestion panel               |
| `frontend/src/components/CompletePage.tsx` | Summary and PDF download                                     |
| `backend/src/app.ts`                       | Routes, request limits, and the usage safety net             |
| `backend/src/services/analyzeDocument.ts`  | The review prompt and the format check with retries          |
| `backend/src/services/llm.ts`              | Connection to the AI provider, with retries when it is busy  |
| `backend/src/services/review.ts`           | Creating a review, syncing edits, and accepting a suggestion |
| `backend/src/services/locateQuote.ts`      | Finds where each quoted passage sits in the text             |
| `backend/src/services/extractText.ts`      | Reads text from uploaded PDFs and images                     |
| `backend/src/services/exportPdf.ts`        | Builds the downloadable PDF                                  |
| `backend/test/`                            | Unit tests for the core logic                                |
