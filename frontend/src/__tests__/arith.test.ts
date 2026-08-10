import { describe, it, expect } from "vitest";
import { evaluate } from "../os/arith";

describe("arith evaluate", () => {
  it("precedence: multiplication before addition", () => {
    expect(evaluate("2+3*4")).toBe(14);
  });
  it("parentheses override precedence", () => {
    expect(evaluate("(2+3)*4")).toBe(20);
  });
  it("exponentiation is right-associative", () => {
    expect(evaluate("2**10")).toBe(1024);
    expect(evaluate("2**3**2")).toBe(512); // 2**(3**2) = 2**9
  });
  it("modulo", () => {
    expect(evaluate("10%3")).toBe(1);
  });
  it("float division", () => {
    expect(evaluate("7/2")).toBe(3.5);
  });
  it("floats and decimals", () => {
    expect(evaluate("1.5 + 2.25")).toBe(3.75);
  });
  it("unary minus", () => {
    expect(evaluate("-3 + 5")).toBe(2);
    expect(evaluate("2 * -4")).toBe(-8);
  });
  it("unary minus binds looser than ** (Python semantics)", () => {
    expect(evaluate("-2**2")).toBe(-4);
    expect(evaluate("2*-3**2")).toBe(-18);
    expect(evaluate("(-2)**2")).toBe(4);
  });
  it("negative exponent is allowed after **", () => {
    expect(evaluate("2**-2")).toBe(0.25);
  });
  it("subtraction is left-associative", () => {
    expect(evaluate("10 - 3 - 2")).toBe(5);
  });
  it("whitespace is ignored", () => {
    expect(evaluate("  6 *  7 ")).toBe(42);
  });
  it("throws on trailing operator", () => {
    expect(() => evaluate("2+")).toThrow();
  });
  it("throws on empty input", () => {
    expect(() => evaluate("")).toThrow();
  });
  it("throws on unbalanced parens", () => {
    expect(() => evaluate("(2+3")).toThrow();
  });
  it("throws on garbage", () => {
    expect(() => evaluate("2 & 3")).toThrow();
  });
});
