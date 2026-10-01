/*
 * Builds one element with attributes, listeners and children.
 *
 * Internal: not in `exports`, and no product imports it. The products each have
 * their own element helper and this package cannot depend on any of them, so it
 * has one of its own — once. dialog.js and language.js used to carry a copy
 * each, and the two had already drifted on which children they skipped: one
 * dropped every falsy child, which takes a 0 or an empty string with it, and
 * the other only null, undefined and false. The narrower rule is the one kept,
 * because a text node of "0" is content and a `cond && node` that came out
 * false is not.
 */
export function make(tag, { className, text, attrs, on } = {}, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value !== undefined && value !== null) node.setAttribute(name, String(value));
  }
  for (const [name, handler] of Object.entries(on ?? {})) node.addEventListener(name, handler);
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}
