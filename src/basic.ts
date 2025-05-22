import { parseBasic } from 'npm:tiny-ts-parser'

type Term =
  | { tag: 'true' }
  | { tag: 'false' }
  | { tag: 'if'; cond: Term; thn: Term; els: Term }
  | { tag: 'number'; n: number }
  | { tag: 'add'; left: Term; right: Term }
  | { tag: 'var'; name: string }
  | { tag: 'func'; params: Param[]; body: Term }
  | { tag: 'call'; func: Term; args: Term[] }
  | { tag: 'seq'; body: Term; rest: Term }
  | { tag: 'const'; name: string; init: Term; rest: Term }

type Param = { name: string; type: Type }

type Type = 
  | { tag: 'Boolean' }
  | { tag: 'Number' }
  | { tag: 'Func'; params: Param[]; retType: Type }

function typeEq(ty1: Type, ty2: Type): boolean {
    switch (ty2.tag) {
        case 'Boolean':
            return ty1.tag === 'Boolean'
        case 'Number':
            return ty1.tag === 'Number'
        case 'Func': {
            if (ty1.tag !== 'Func') return false
            if (ty1.params.length !== ty2.params.length) return false
            for (let i = 0; i < ty1.params.length; i++) {
                if (! typeEq(ty1.params[i].type, ty2.params[i].type)) {
                    return false
                }
            }
            if (! typeEq(ty1.retType, ty2.retType)) return false
            return true
        }
    }
}

type TypeEnv = Record<string, Type>

function typecheck(t: Term, tyEnv: TypeEnv): Type {
  switch (t.tag) {
    case 'true':
      return { tag: 'Boolean' }
    case 'false':
      return { tag: 'Boolean' }
    case 'if': {
      const condTy = typecheck(t.cond, tyEnv)
      if (condTy.tag !== 'Boolean') throw 'boolean expected'
      const thnTy = typecheck(t.thn, tyEnv)
      const elsTy = typecheck(t.els, tyEnv)
      if (! typeEq(thnTy, elsTy)) throw 'then and else have different types'
      return thnTy
    }
    case 'number':
      return { tag: 'Number' }
    case 'add': {
      const leftTy = typecheck(t.left, tyEnv)
      if (leftTy.tag !== 'Number') throw 'number expected'
      const rightTy = typecheck(t.right, tyEnv)
      if (rightTy.tag !== 'Number') throw 'number expected'
      return { tag: 'Number' }
    }
    case 'var': {
        if (tyEnv[t.name] === undefined)
            throw new Error(`unknown vsriable: ${t.name}`)
        return tyEnv[t.name]
    }
    case 'func': {
        const newTyEnv = { ... tyEnv }
        for (const { name, type } of t.params) {
            newTyEnv[name] = type;
        }
        const retType = typecheck(t.body, newTyEnv)
        return { tag: 'Func', params: t.params, retType }
    }
    case 'call': {
        const funcTy = typecheck(t.func, tyEnv)
        if (funcTy.tag !== 'Func') throw new Error('function type expected')
        for (let i = 0; i < t.args.length; i++) {
            const argTy = typecheck(t.args[i], tyEnv)
            if (! typeEq(argTy, funcTy.params[i].type)) {
                throw new Error('parameter type mismatch')
            }
        }
        return funcTy.retType
    }
    case 'seq':
        typecheck(t.body, tyEnv)
        return typecheck(t.rest, tyEnv)
    case 'const': {
        const ty = typecheck(t.init, tyEnv)
        const newTyEnv = { ...tyEnv, [t.name]: ty }
        return typecheck(t.rest, newTyEnv)
    }
    default:
        throw new Error('not implemented yet')
  }
}

console.log(typecheck(parseBasic('(x: boolean) => x'), {}))
console.log(typecheck(parseBasic('( (x: number) => x )(42)'), {}))

// エラーになる例
try {
    console.log(typecheck(parseBasic('( (x: number) => x )(true)'), {}))
} catch (e) {
    console.error(e)
}

console.log(typecheck(parseBasic(`
    const add = (x: number, y: number) => x + y
    const select = (b: boolean, x: number, y: number) => b ? x : y
    
    const x = add(1, add(2, 3))
    const y = select(true, x, x)
    
    y
`), {}))

console.log('complete')