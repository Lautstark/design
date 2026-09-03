import { describe, expect, it, vi } from 'vitest';
import { NAMES, languagePicker } from '../docs/lib/language.js';

/*
 * The control somebody reaches for when they cannot read the interface around
 * it. What is asserted is what the three copies disagreed about, plus the one
 * rule that makes it safe for this package to carry words at all.
 */

const build = (over = {}) => languagePicker({
  languages: ['de', 'en'],
  current: () => 'de',
  choose: () => {},
  label: 'Sprache',
  ...over,
});

const buttons = (picker) => [...picker.node.querySelectorAll('button')];

describe('the language names', () => {
  /* The exception that lets this module ship strings at all: a language's name
     is not a translation. „Deutsch" is Deutsch on an English page. A picker that
     said "German" to a German speaker stranded in the English build would fail
     exactly where it is needed. */
  it('calls each language what it calls itself', () => {
    expect(buttons(build()).map((b) => b.textContent)).toEqual(['Deutsch', 'English']);
  });

  it('lets a product name a language this file has never heard of', () => {
    const picker = build({ languages: ['de', 'nl'], names: { nl: 'Nederlands' } });
    expect(buttons(picker).map((b) => b.textContent)).toEqual(['Deutsch', 'Nederlands']);
  });

  /* A two-letter button somebody can still press beats a blank one, and it
     names the gap for whoever adds the language. */
  it('falls back to the code rather than to nothing', () => {
    expect(buttons(build({ languages: ['fr'] }))[0].textContent).toBe('fr');
  });
});

describe('which one is in force', () => {
  it('presses the current one and only that one', () => {
    const pressed = buttons(build()).map((b) => b.getAttribute('aria-pressed'));
    expect(pressed).toEqual(['true', 'false']);
  });

  /* Two of the three products change language without reloading, so the pressed
     button has to be able to move — and `current` is read on every repaint
     rather than captured, or the row would go on showing the language the
     reader has just left. */
  it('follows a language that changes under it', () => {
    let now = 'de';
    const picker = build({ current: () => now });
    now = 'en';
    picker.refresh();
    expect(buttons(picker).map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
  });

  it('says false rather than nothing on the ones not chosen', () => {
    // An absent aria-pressed is not "not pressed", it is unreadable.
    expect(buttons(build())[1].hasAttribute('aria-pressed')).toBe(true);
  });
});

describe('what the caller still owns', () => {
  it('takes the group name from the product, because that one is a translation', () => {
    expect(build({ label: 'Language' }).node.getAttribute('aria-label')).toBe('Language');
  });

  it('is a labelled group, which only one of the three copies was', () => {
    expect(build().node.getAttribute('role')).toBe('group');
  });

  /* conventions.md §4.12: a module that emits a class name ships the rule that
     draws it. `.segmented` is components.css's; `.opt`, `.small` and `.faint`
     are bildhaft's alone, so the row goes back bare and the product places it. */
  it('emits nothing but the segmented row', () => {
    const node = build().node;
    expect(node.className).toBe('segmented');
    expect(node.querySelector('.opt, .small, .faint')).toBeNull();
  });

  it('tells the product which code was pressed', () => {
    const choose = vi.fn();
    buttons(build({ choose }))[1].click();
    expect(choose).toHaveBeenCalledWith('en');
  });
});

describe('NAMES', () => {
  it('is endonyms and stays that way', () => {
    expect(NAMES.de).toBe('Deutsch');
    expect(NAMES.en).toBe('English');
  });
});
