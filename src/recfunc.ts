import { error, parseRecFunc } from 'npm:tiny-ts-parser'

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
  | {
    tag: 'recFunc';
    funcName: string;
    params: Param[];
    retType: Type;
    body: Term;
    rest: Term;
  }

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
            throw new Error(`unknown variable: ${t.name}`)
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
    case 'recFunc': {
        const funcTy: Type = { tag: 'Func', params: t.params, retType: t.retType }
        const newTyEnv = { ...tyEnv }
        for (const { name, type } of t.params) {
            newTyEnv[name] = type;
        }
        newTyEnv[t.funcName] = funcTy
        const retType = typecheck(t.body, newTyEnv)
        if (!typeEq(t.retType, retType)) error('wrong return type', t)
        const newTyEnv2 = { ...tyEnv, [t.funcName]: funcTy }
        return typecheck(t.rest, newTyEnv2)
    }
    default:
        throw new Error('not implemented yet')
  }
}

console.log(typecheck(parseRecFunc(`
    function f(x: number): number { return f(x) }
    f(0)
`), {}))

console.log('complete')