import { describe, expect, it } from "vitest";
import { normaliseKenyanPhone } from "./phone";

describe("normaliseKenyanPhone", () => {
  it("accepts the common formats", () => {
    expect(normaliseKenyanPhone("0712345678")).toBe("254712345678");
    expect(normaliseKenyanPhone("+254 712 345 678")).toBe("254712345678");
    expect(normaliseKenyanPhone("712345678")).toBe("254712345678");
    expect(normaliseKenyanPhone("0112345678")).toBe("254112345678");
  });
  it("rejects bad numbers", () => {
    expect(normaliseKenyanPhone("")).toBeNull();
    expect(normaliseKenyanPhone("0812345678")).toBeNull();
    expect(normaliseKenyanPhone("07123456")).toBeNull();
    expect(normaliseKenyanPhone(undefined)).toBeNull();
  });
  it("handles separators and the international prefix", () => {
    expect(normaliseKenyanPhone("254712345678")).toBe("254712345678");
    expect(normaliseKenyanPhone("+254-712-345-678")).toBe("254712345678");
    expect(normaliseKenyanPhone("(0712) 345 678")).toBe("254712345678");
    expect(normaliseKenyanPhone("  0712345678\n")).toBe("254712345678");
    expect(normaliseKenyanPhone("112345678")).toBe("254112345678");
  });
  it("accepts non-string input that stringifies to a valid number", () => {
    expect(normaliseKenyanPhone(712345678)).toBe("254712345678");
  });
  it("rejects wrong lengths, other countries and junk", () => {
    expect(normaliseKenyanPhone("07123456789")).toBeNull();
    expect(normaliseKenyanPhone("2547123456")).toBeNull();
    expect(normaliseKenyanPhone("255712345678")).toBeNull();
    expect(normaliseKenyanPhone("+1 212 555 0100")).toBeNull();
    expect(normaliseKenyanPhone("abc")).toBeNull();
    expect(normaliseKenyanPhone(null)).toBeNull();
    expect(normaliseKenyanPhone({})).toBeNull();
    expect(normaliseKenyanPhone("0212345678")).toBeNull();
    expect(normaliseKenyanPhone("00254712345678")).toBeNull();
  });
});
