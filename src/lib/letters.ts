/**
 * Placeholders a template letter can use. Kept small and readable so people
 * who have never seen a template can still write one.
 */
export const PLACEHOLDERS = [
  { token: "{name}", label: "their name" },
  { token: "{my_name}", label: "your name" },
] as const;

export function fillTemplate(body: string, vars: { name: string; myName: string }): string {
  return body.replaceAll("{name}", vars.name).replaceAll("{my_name}", vars.myName);
}

/** Starting points for people staring at a blank page. Written to be edited. */
export const STARTERS = [
  {
    id: "where-things-are",
    title: "Where things are",
    kind: "template" as const,
    body: `Dear {name},

If you are reading this, I haven’t been able to check in for a while, and you are one of the people I trust with the practical things.

The important papers are in:
The bank accounts and policies are listed in:
The person to call first is:

Please don’t worry about getting everything right. Take your time.

{my_name}`,
  },
  {
    id: "a-proper-goodbye",
    title: "The things I never said",
    kind: "personal" as const,
    body: `Dear {name},

I kept meaning to say this properly, so here it is.



With all my love,
{my_name}`,
  },
  {
    id: "passwords",
    title: "Accounts and passwords",
    kind: "personal" as const,
    body: `{name},

These are the accounts that need closing or looking after. The password manager’s master password is written below; everything else is inside it.

Password manager:
Master password:
Email accounts:
Phone unlock code:

{my_name}`,
  },
] as const;

export function excerpt(body: string, length = 140): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > length ? `${flat.slice(0, length).trimEnd()}…` : flat;
}
