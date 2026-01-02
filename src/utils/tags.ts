export function normaliseTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLowerCase();
}

export function hasTag(tags: string[], tag: string): boolean {
  const t = tag.toLowerCase();
  return tags.some((existing) => existing.toLowerCase() === t);
}

export function addTag(tags: string[], raw: string): string[] {
  const tag = normaliseTag(raw);
  if (!tag) return tags;

  if (hasTag(tags, tag)) return tags;

  return [...tags, tag];
}

export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((t) => normaliseTag(t) !== normaliseTag(tag));
}

export function addTagsFromInput(tags: string[], input: string): string[] {
  const parts = input
    .split(",")
    .map((t) => normaliseTag(t))
    .filter(Boolean);

  let next = tags;
  for (const part of parts) {
    next = addTag(next, part);
  }

  return next;
}
