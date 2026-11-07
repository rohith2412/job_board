// Turns free-form job location strings ("Toronto, ON or Vancouver, BC (Hybrid)", "Remote (US & Canada)")
// into the places and countries Google for Jobs structured data expects.

const CA_PROVINCE_CODES = new Set(["ON", "BC", "QC", "AB", "MB", "SK", "NB", "NS", "PE", "NL", "YT", "NT", "NU"]);
const CA_PROVINCE_NAMES =
  /\b(alberta|british columbia|manitoba|new brunswick|newfoundland|nova scotia|ontario|prince edward island|qu[eé]bec|saskatchewan|yukon|northwest territories|nunavut)\b/i;
const US_MENTION = /\b(us|usa|u\.s\.|united states)\b/i;

export type JobPlace = { locality: string; region: string; country: "US" | "CA" };

export type ParsedJobLocation = {
  places: JobPlace[];
  remote: boolean;
  remoteCountries: ("US" | "CA")[];
};

function isCanadian(text: string, region: string) {
  return /canada/i.test(text) || CA_PROVINCE_CODES.has(region.toUpperCase()) || CA_PROVINCE_NAMES.test(region);
}

export function parseJobLocation(location: string | undefined): ParsedJobLocation {
  const raw = (location ?? "").trim();
  const remote = /\bremote\b/i.test(raw);
  const notes = [...raw.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).join(" ");
  const withoutNotes = raw.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();

  const places = withoutNotes
    .split(/\s+or\s+|;|\s·\s|\s\|\s/i)
    .map((part) => part.trim())
    .filter((part) => part && !/^remote$/i.test(part))
    .map((part): JobPlace => {
      const [locality = "", region = ""] = part.split(",").map((s) => s.trim());
      return { locality, region, country: isCanadian(part, region) ? "CA" : "US" };
    })
    .filter((place) => place.locality);

  const remoteCountries: ("US" | "CA")[] = [];
  if (remote) {
    const scope = `${notes} ${withoutNotes}`;
    if (US_MENTION.test(scope)) remoteCountries.push("US");
    if (/canada/i.test(scope) || CA_PROVINCE_NAMES.test(scope)) remoteCountries.push("CA");
    if (remoteCountries.length === 0) remoteCountries.push(...new Set(places.map((p) => p.country)));
    if (remoteCountries.length === 0) remoteCountries.push("US");
  }

  return { places, remote, remoteCountries };
}

// Currency for structured data: explicit in the salary text, otherwise inferred from where the job is.
export function salaryCurrency(salary: string, parsed: ParsedJobLocation): "USD" | "CAD" {
  if (/\bCAD\b|C\$/.test(salary)) return "CAD";
  if (/\bUSD\b|US\$/.test(salary)) return "USD";
  const countries = new Set([...parsed.places.map((p) => p.country), ...parsed.remoteCountries]);
  return countries.size === 1 && countries.has("CA") ? "CAD" : "USD";
}
