import { Jurisdiction } from "../types/issue";

export async function getJurisdictions(): Promise<Jurisdiction[]> {
  const res = await fetch("/api/jurisdictions");
  if (!res.ok) throw new Error("Could not load countries and regions.");
  return res.json();
}
