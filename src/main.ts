import { parseArith } from 'npm:tiny-ts-parser'

type Term =
  | { tag: 'true' }
  | { tag: 'false' }
  | { tag: 'if'; cond: Term; thn: Term; els: Term }
  | { tag: 'number'; n: number }
  | { tag: 'add'; left: Term; right: Term }

type Type = 
  | { tag: 'Boolean' }
  | { tag: 'Number' }

function typecheck(t: Term): Type {
  switch (t.tag) {
    case 'true':
      return { tag: 'Boolean' }
    case 'false':
      return { tag: 'Boolean' }
  }
  throw 'unknown';
}

console.log(parseArith('100'))
