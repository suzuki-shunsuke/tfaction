declare module "@marcbachmann/cel-js" {
  export function evaluate(
    expression: string,
    context?: Record<string, unknown>,
  ): unknown;
  export function parse(expression: string): unknown;
  export class EvaluationError extends Error {}
  export class ParseError extends Error {}
}
