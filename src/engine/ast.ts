// Expression AST produced by the parser and consumed by the evaluator.
export type Node =
  | { kind: 'num'; value: number }
  | { kind: 'ident'; name: string }
  | { kind: 'unary'; op: '+' | '-'; arg: Node }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/'; left: Node; right: Node }
  | { kind: 'pow'; base: Node; exp: Node }
  | { kind: 'call'; name: string; arg: Node }
  | { kind: 'convert'; expr: Node; target: Node; targetText: string }
