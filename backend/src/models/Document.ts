import { Schema, model, Types } from "mongoose";

// A single nested subdocument (rather than a nested path) so that null is
// stored and returned as null when no legal basis applies.
const legalBasisSchema = new Schema(
  {
    citation: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const issueSchema = new Schema(
  {
    quote: { type: String, required: true },
    startOffset: { type: Number, required: true },
    endOffset: { type: Number, required: true },
    summary: { type: String, required: true },
    reasoning: { type: String, required: true },
    suggestion: { type: String, required: true },
    legalBasis: { type: legalBasisSchema, default: null },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { _id: true }
);

const documentSchema = new Schema(
  {
    text: { type: String, required: true },
    country: { type: String, enum: ["US", "CA"], required: true },
    region: { type: String, required: true },
    issues: { type: [issueSchema], default: [] },
  },
  { timestamps: true }
);

export const DocumentModel = model("Document", documentSchema);
