import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../app/projects.ts';

// Characterises the content before it is restructured: every project needs the
// fields the UI renders, links must be real URLs, and the landmarks must sit
// inside the walkable area without overlapping each other.
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const httpsUrl = (value) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

test('there are four projects with unique ids and numbers 01 to 04 in order', () => {
  assert.equal(PROJECTS.length, 4);
  assert.equal(new Set(PROJECTS.map((p) => p.id)).size, 4);
  assert.deepEqual(PROJECTS.map((p) => p.number), ['01', '02', '03', '04']);
});

for (const project of PROJECTS) {
  test(`${project.id}: every field the UI renders is filled in`, () => {
    for (const field of ['id', 'title', 'place', 'type', 'line', 'description', 'role', 'status']) {
      assert.ok(text(project[field]), `${project.id}.${field} must be a non-empty string`);
    }
    assert.match(project.color, /^#[0-9a-f]{6}$/i);
    assert.ok(Array.isArray(project.stack) && project.stack.length > 0);
    assert.ok(project.stack.every(text));
  });

  test(`${project.id}: has three case notes, each with a title and a story`, () => {
    assert.equal(project.notes.length, 3);
    for (const [title, story] of project.notes) {
      assert.ok(text(title), 'note title');
      assert.ok(text(story), 'note story');
    }
  });

  test(`${project.id}: links are https URLs with labels, or the work is private`, () => {
    if (project.link) {
      assert.ok(httpsUrl(project.link), `${project.id}.link`);
      assert.ok(text(project.linkLabel), `${project.id}.linkLabel`);
    } else {
      assert.equal(project.secondary ?? null, null, 'a secondary link needs a primary link');
    }
    if (project.secondary) {
      assert.ok(httpsUrl(project.secondary), `${project.id}.secondary`);
      assert.ok(text(project.secondaryLabel), `${project.id}.secondaryLabel`);
    }
  });
}

test('landmarks sit inside the walkable area and apart from each other', () => {
  for (const p of PROJECTS) {
    assert.ok(Math.abs(p.x) <= 18 && p.z >= -23 && p.z <= 18, `${p.id} is out of bounds`);
  }
  for (const [i, a] of PROJECTS.entries()) {
    for (const b of PROJECTS.slice(i + 1)) {
      assert.ok(Math.hypot(a.x - b.x, a.z - b.z) > 6.4, `${a.id} and ${b.id} are too close (interaction radius is 3.2)`);
    }
  }
});
