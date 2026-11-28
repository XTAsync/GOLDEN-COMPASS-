import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(join(__dirname, f), "utf8");

const focusable = [
  "button.tsx",
  "input.tsx",
  "textarea.tsx",
  "checkbox.tsx",
  "radio-group.tsx",
  "select.tsx",
  "switch.tsx",
  "toggle.tsx",
  "slider.tsx",
];

describe("shared UI primitives accessibility", () => {
  it.each(focusable)("%s has a visible 2px focus ring", (f) => {
    const src = read(f);
    expect(src).toMatch(/focus(-visible)?:ring-2/);
    expect(src).not.toMatch(/focus(-visible)?:ring-1/);
  });

  it.each(["dialog.tsx", "sheet.tsx"])("%s close button is named and has a focus ring", (f) => {
    const src = read(f);
    expect(src).toContain('<span className="sr-only">Close</span>');
    expect(src).toMatch(/focus-visible:ring-2/);
  });
});
