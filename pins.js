#!/usr/bin/env node
/*
 * Which shared packages this repository pins, and whether anything newer shipped.
 *
 *   node node_modules/@lautstark/design/pins.js
 *   node node_modules/@lautstark/design/pins.js --strict   non-zero when behind
 *
 * The family pins every shared package to an exact release tag, so that an
 * install can never move what the build is made of. That rule is right and it
 * is written down — see bildhaft's README under Constraints. What it has never
 * had is the other half: nothing notices when a pin stops being current, so the
 * three products only come level when somebody levels them by hand.
 *
 * They had drifted two versions apart before anybody looked: vorlaut on design
 * 1.5.0 while mitreden and bildhaft sat on 1.4.3, which is two versions of a
 * shared look across three products meant to be one family. Nothing was
 * stopping them. This is the thing that says so out loud.
 *
 * It warns and does not fail, deliberately. Being a patch behind is not a
 * reason to block a deploy that fixes something else, and a check that can stop
 * an urgent release for a cosmetic reason is a check people route around.
 * --strict exists for anybody who wants the opposite.
 *
 * It lives here rather than three times over for the same reason components.css
 * does. Every product already depends on this package, so every product already
 * has it.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const strict = process.argv.includes('--strict');

/* The pin this family's rule asks for: an exact tag, on a repository in the
   org. A range or a branch is a finding in itself, not an unparseable line —
   both mean an install can move the build, which is the thing the rule exists
   to prevent. */
const PIN = /^github:Lautstark\/([^#]+)#(.+)$/;
const TAG = /^v\d+\.\d+\.\d+$/;

const parse = (tag) => tag.replace(/^v/, '').split('.').map(Number);

/** Newest first, by number and not by string: v1.10.0 is above v1.9.0. */
function newest(tags) {
  const versions = tags.filter((t) => TAG.test(t)).sort((a, b) => {
    const [x, y] = [parse(a), parse(b)];
    return (y[0] - x[0]) || (y[1] - x[1]) || (y[2] - x[2]);
  });
  return versions[0] ?? null;
}

/** The tags a repository publishes, asked of the remote rather than a clone. */
function publishedTags(repo) {
  const out = execFileSync('git',
    ['ls-remote', '--tags', '--refs', `https://github.com/Lautstark/${repo}.git`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return out.split('\n').filter(Boolean).map((line) => line.split('/').pop());
}

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
const declared = { ...manifest.dependencies, ...manifest.devDependencies };

const rows = [];
for (const [name, spec] of Object.entries(declared)) {
  const found = PIN.exec(spec ?? '');
  if (!found) continue;
  const [, repo, ref] = found;

  if (!TAG.test(ref)) {
    // Not "cannot read this" — a range or a branch is the finding.
    rows.push({ name, repo, ref, latest: null, state: 'not a tag' });
    continue;
  }

  let latest = null;
  try {
    latest = newest(publishedTags(repo));
  } catch {
    // A network that is not there is not this repository's problem to report.
    rows.push({ name, repo, ref, latest: null, state: 'unreachable' });
    continue;
  }

  rows.push({ name, repo, ref, latest,
    state: latest === null ? 'no releases' : latest === ref ? 'current' : 'behind' });
}

if (!rows.length) {
  console.log('No github:Lautstark pins in this package.json.');
  process.exit(0);
}

const width = Math.max(...rows.map((r) => r.name.length));
for (const row of rows) {
  const detail = row.state === 'behind' ? `${row.ref} → ${row.latest} available`
    : row.state === 'current' ? `${row.ref}`
      : `${row.ref} (${row.state})`;
  const mark = row.state === 'current' ? '✓' : row.state === 'behind' ? '↑' : '?';
  console.log(`  ${mark} ${row.name.padEnd(width)}  ${detail}`);
}

/* GitHub reads these off stdout and hangs them on the run, so a warning is
   visible from the workflow list without opening the log. */
const annotate = (title, message) => {
  if (process.env.GITHUB_ACTIONS) console.log(`::warning title=${title}::${message}`);
};

const behind = rows.filter((r) => r.state === 'behind');
const loose = rows.filter((r) => r.state === 'not a tag');

for (const row of behind)
  annotate('A shared package has moved on',
    `${row.name} is pinned to ${row.ref}; ${row.latest} has shipped. `
    + `Bump it with: npm install ${row.name}@github:Lautstark/${row.repo}#${row.latest}`);

for (const row of loose)
  annotate('A shared package is not pinned to a tag',
    `${row.name} resolves "${row.ref}", so an install can move what the build is `
    + 'made of. The family pins exact release tags.');

/* The all-clear is only the all-clear when every row was actually answered.
   Counting behind and loose alone let an unreachable remote print "every shared
   package is pinned to its latest release", which is a sentence this script has
   no way of knowing is true — and a check that reports success when it could
   not run is worse than one that is missing. */
const unanswered = rows.filter((r) => r.state === 'unreachable' || r.state === 'no releases');

if (behind.length || loose.length || unanswered.length) {
  const parts = [];
  if (behind.length) parts.push(`${behind.length} behind`);
  if (loose.length) parts.push(`${loose.length} not pinned to a tag`);
  if (unanswered.length) parts.push(`${unanswered.length} could not be checked`);
  console.log(`\n${parts.join(', ')}.`);
  // Not --strict's business: an unreachable remote is the network's doing and
  // failing on it would make every offline run a red build.
  if (strict && (behind.length || loose.length)) process.exit(1);
} else {
  console.log('\nEvery shared package is pinned to its latest release.');
}
