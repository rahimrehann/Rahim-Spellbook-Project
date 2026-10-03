import { Jurisdiction } from "@/types/issue";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JurisdictionSelectProps {
  jurisdictions: Jurisdiction[];
  country: string;
  region: string;
  onCountryChange: (country: string) => void;
  onRegionChange: (region: string) => void;
}

/**
 * Country dropdown, then a state or province dropdown once a country is
 * chosen. The region list and its label come from the selected country.
 */
export function JurisdictionSelect({
  jurisdictions,
  country,
  region,
  onCountryChange,
  onRegionChange,
}: JurisdictionSelectProps) {
  const selected = jurisdictions.find((j) => j.code === country);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label>Country</Label>
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {jurisdictions.map((j) => (
              <SelectItem key={j.code} value={j.code}>
                {j.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="grid gap-2">
          <Label>{selected.regionLabel}</Label>
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select a ${selected.regionLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {selected.regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
