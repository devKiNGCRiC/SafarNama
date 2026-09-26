// Validates and whitelists what a person can change on their own profile. Only fields that were
// sent are checked and returned; an empty string clears a text field.
import { normalizeWebUrl } from "./safeUrl.js";

export const SOCIAL_PLATFORMS = ["facebook", "twitter", "instagram", "linkedin", "youtube"];
export const LIMITS = { name: [2, 50], bio: 500, location: 80, occupation: 80, interests: 10, interestLength: 30, socialLinks: 5 };

const text = (value) => (typeof value === "string" ? value.trim() : undefined);

export function parseProfileInput(body = {}) {
  const errors = [];
  const user = {};
  const profile = {};
  const has = (key) => body[key] !== undefined;

  for (const [key, label] of [["firstName", "First name"], ["lastName", "Last name"]]) {
    if (!has(key)) continue;
    const value = text(body[key]);
    if (value === undefined || value.length < LIMITS.name[0] || value.length > LIMITS.name[1]) {
      errors.push(`${label} must be ${LIMITS.name[0]} to ${LIMITS.name[1]} characters`);
    } else user[key] = value;
  }

  for (const [key, max, label] of [["bio", LIMITS.bio, "Bio"], ["location", LIMITS.location, "Location"], ["occupation", LIMITS.occupation, "Occupation"]]) {
    if (!has(key)) continue;
    const value = text(body[key]);
    if (value === undefined || value.length > max) errors.push(`${label} can be at most ${max} characters`);
    else profile[key] = value;
  }

  if (has("website")) {
    const raw = text(body.website);
    if (raw === undefined) errors.push("Website is not valid");
    else if (raw === "") profile.website = "";
    else {
      const url = normalizeWebUrl(raw);
      if (!url) errors.push("Website must be a web address like https://example.com");
      else profile.website = url;
    }
  }

  if (has("interests")) {
    if (!Array.isArray(body.interests)) errors.push("Interests must be a list");
    else {
      const seen = new Set();
      const interests = [];
      for (const item of body.interests) {
        const value = text(item);
        if (!value) continue;
        if (value.length > LIMITS.interestLength) {
          errors.push(`Each interest can be at most ${LIMITS.interestLength} characters`);
          break;
        }
        if (!seen.has(value.toLowerCase())) {
          seen.add(value.toLowerCase());
          interests.push(value);
        }
      }
      if (interests.length > LIMITS.interests) errors.push(`You can add at most ${LIMITS.interests} interests`);
      else profile.interests = interests;
    }
  }

  if (has("socialLinks")) {
    if (!Array.isArray(body.socialLinks) || body.socialLinks.length > LIMITS.socialLinks) {
      errors.push(`You can add at most ${LIMITS.socialLinks} social links`);
    } else {
      const links = [];
      for (const item of body.socialLinks) {
        const platform = typeof item?.platform === "string" ? item.platform.toLowerCase() : "";
        const url = normalizeWebUrl(item?.url);
        if (!SOCIAL_PLATFORMS.includes(platform)) {
          errors.push(`Social platform must be one of: ${SOCIAL_PLATFORMS.join(", ")}`);
          break;
        }
        if (!url) {
          errors.push(`The ${platform} link must be a web address like https://example.com`);
          break;
        }
        if (links.some((l) => l.platform === platform)) {
          errors.push(`Only one ${platform} link is allowed`);
          break;
        }
        links.push({ platform, url });
      }
      if (!errors.length) profile.socialLinks = links;
    }
  }

  return { user, profile, errors };
}
