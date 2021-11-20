
import {h} from 'hyperapp';
import { is_array } from 'locutus/php/var';

export const tnOnCreate = (el) => {
  var tid = null
  el.classList.add('wq-is-created')
  window.setTimeout(() => {
    el.classList.add('wq-is-run')
    el.classList.remove('wq-is-created')
    el.addEventListener('transitionend', () => {
      el.classList.remove('wq-is-run')
      window.clearTimeout(tid)
    }, {once:true})
    tid = window.setTimeout(() => {
      el.classList.remove('wq-is-run')
    }, 3000)
  }, 50)
}

export const tnOnRemove = (el, done) => {
  var tid = null
  el.classList.add('wq-is-run')
  window.setTimeout(() => {
    el.classList.add('wq-is-removed')
    el.addEventListener('transitionend', () => {
      try {
        el.classList.remove('wq-is-run')
        window.clearTimeout(tid)
        done()
      } catch (ex) {
        // ignore
      }
    })
  }, 50)
  tid = window.setTimeout(() => {
    try {
      done()
    } catch (ev) {
      // ignore
    }
  }, 3000)
}

const extractMessage = e => {
  // 1つのプロパティに複数のエラーが出る場合がある。
  // その場合、最後のエラーを表示する。
  // ただし、anyOfに関するエラーは除外する。
  return e.message.indexOf('should match pattern') === 0 ? 'should match pattern' : 
         e.message === 'should match some schema in anyOf' ? null : e.message
}

export const createMessages = (es) => {
  return es.reduce((ms, e) => {
    const msg = extractMessage(e)
    if (msg === null) return ms
    else return {...ms, [e.dataPath]:msg}
  }, {})
}

export const updateMessages = (ms, path, es) => {
  const es2 = (es === null) ? [] : es.filter(e => e.dataPath == path)
  if (es2.length == 0) {
    // delete
    const ms2 = {...ms}
    delete ms2[path]
    return ms2
  } else {
    // replace
    return es.reduce((ms, e) => {
      const msg = extractMessage(e)
      if (msg === null) return ms
      else return {...ms, [path]:msg}
    }, ms)
  }
}

const br = {nodeName:'br', attributes:{}, children:[]}

export const strToVdom = (x) => {
  const lines = x.split('\n')
  if (lines.length == 1) return lines[0]
  
  return lines.reduce((cur, line) => {
    return (cur.length == 0) ? [line] : [...cur, br, line]
  }, [])
}

export const translate = (catalog) => (x) => {
  if (typeof x == 'undefined') return null
  if (catalog.hasOwnProperty(x)) {
    return catalog[x]
  } else {
    console.log('TO TRANSLATE: ', x);
    return x;
  }
}

export const deepCopy = (x) => JSON.parse(JSON.stringify(x))

export const Message = (props, children) => {
  if (children.length == 0) return null
  if (props.hasOwnProperty('id')) {
    props.key = props.id
  }
  return (
    <div class="wq-Message" {...props}>{children}</div>
  )
}

export const Image = (
    {
      src, 
      scaling = 'center', 
      alt = '', 
      title = null
    }) => {
  const style = {backgroundImage: "url("+src+")"}
  return (
    <div class={`wq-Image wq-scaling-${scaling}`} style={style} title={title}>
      <img src={src} alt={alt} class="wq--img" />
    </div> 
  )
}

const isViewable = (name) => {
  const i = name.lastIndexOf('.')
  const ext = name.slice(i + 1).trim().toLowerCase()
  return " jpeg jpg gif png ".includes(ext)
}
export const File = (
    {
      url, 
      name, 
      ...props
    }
) => {
  const viewable = url && isViewable(name)
  return (
    <div class={`wq-File ${viewable ? 'wq-is-viewable' : ''}`} {...props}>
      {viewable ? (
        <Image src={url} alt={name} scaling="cover" xclass="wq-belongs-file" title={name} />
      ) : null}
      <div class="wq--filename" title={name}>{name}</div>
    </div>
  )
}

export const focusErrorInput = (es) => {
  if (es.length == 0) return;
  const name = es[0].dataPath.slice(1);
  const elems = document.getElementsByName(name);
  if (elems.length == 0) return;
  elems[0].focus();
}

export const mapHash = (f, hash) => {
  const rv = {}
  for (let p in hash) {
    rv[p] = f(p, hash[p])
  }
  return rv
}

export const reduceHash = (f, cur, hash) => {
  for (let key in hash) {
    cur = f(cur, key, hash[key])
  }
  return cur
}

export const appendVars = (bindings, vars) => {
  return vars.map(v => {
    const b = findByProp('sym', v.sym, bindings)
    if (b) {
      return b
    } else {
      return {sym:v.sym, ref:-1}
    }
  })
}

export const branchNo = (name, sep) => {
  const off = name.lastIndexOf(sep)
  const fragment = name.slice(off + 1)
  return parseInt(fragment)
}

export const findByProp = (name, val, arr) => {
  const len = arr.length
  for (let i = 0; i < len; i++) {
    if (arr[i][name] == val) return arr[i]
  }
  return undefined
}

export const findIndexByProp = (name, val, arr) => {
  const len = arr.length
  for (let i = 0; i < len; i++) {
    if (arr[i][name] == val) return i
  }
  return -1
}

export const lmove = (arr, from, to) => {
  const item = arr[from]
  const arr2 = arr.filter((e, i) => i != from)
  arr2.splice(to, 0, item)
  return arr2
}

export const linsert = (arr, idx, e) => {
  const arr2 = arr.reduce((cur, e0, i) => {
    if (i == idx) {
      return [...cur, e, e0]
    } else {
      return [...cur, e0]
    }
  }, [])
  if (arr2.length == idx) {
    arr2.push(e)
  }
  return arr2
}

export const lremove = (arr, from) => {
  arr = arr.filter((e, i) => i != from)
  return arr
}

export const lreplace = (arr, idx, e) => {
  return arr.map((e0, i) => (i == idx) ? e : e0)
}

export const joinSet = (set, glue) => {
  let rv = ''
  let isTail = false
  for (let key in set) {
    if (isTail) rv += glue
    rv += key
    isTail = true
  }
  return rv
}

export const scrollToTop = () => {
  const c = document.documentElement.scrollTop || document.body.scrollTop;
  if (c > 0) {
    const diff = Math.max(c / 8, 4)
    window.requestAnimationFrame(scrollToTop);
    window.scrollTo(0, c - diff);
  }
};

export function sprintf(format) {
  var args = arguments;
  var offset = 1;
  return format.replace(/%([0-9]\$)?([^0-9])/g, function (match, f1, f2) {
    if (f2 == '%') {
      return '%';
    } else if (f2 == 's') {
      if (! f1) {
        return args[offset++];
      } else {
        return args[f1.slice(0, 1)];
      }
    }
  });
}

export const makeParser = (_T) => {
  const opMap = {
    '+': {prec:3, alignL:true}, 
    '-': {prec:3, alignL:true}, 
    '*': {prec:4, alignL:true}, 
    '/': {prec:4, alignL:true}, 
    '^': {prec:5, alignL:false}
  }
  const funMap = {
    'IFERROR': {minArity:2, maxArity:2}, 
    'ROUND': {minArity:2, maxArity:2}, 
    'ROUNDDOWN': {minArity:2, maxArity:2}, 
    'ROUNDUP': {minArity:2, maxArity:2}, 
    'TRUNC': {minArity:1, maxArity:2}, 
    'INT': {minArity:1, maxArity:1}, 
    'ABS': {minArity:1, maxArity:1}, 
    'SIGN': {minArity:1, maxArity:1}, 
    'QUOTIENT': {minArity:2, maxArity:2}, 
    'MOD': {minArity:2, maxArity:2}, 
    'MIN': {minArity:1, maxArity:255}, 
    'MAX': {minArity:1, maxArity:255}, 
    'SWITCH': {minArity:1, maxArity:255}
  }
  const reSp = /\s+/y
  const reOp = /[\+\-\*/\^]/y
  const reLit = /-?[0-9]+(\.[0-9]+)?/y
  const reVar = /[a-zA-Z][0-9a-zA-Z-_]*/y
  const reSep = /[\(\),]/y

  const tokenize = (str) => {
    const len = str.length
    const rv = []
    let ms
    let off = 0

    while (off < len) {
      // skip spaces
      reSp.lastIndex = off
      if (reSp.exec(str)) {
        off = reSp.lastIndex
      }

      if (off >= len) break

      reLit.lastIndex = off
      if (ms = reLit.exec(str)) {
        rv.push({type:'LIT', word:+ms[0], off})
        off = reLit.lastIndex
        continue
      }

      reVar.lastIndex = off
      if (ms = reVar.exec(str)) {
        rv.push({type:'VAR', word:ms[0].toUpperCase(), off})
        off = reVar.lastIndex
        continue
      }
  
      reSep.lastIndex = off
      if (ms = reSep.exec(str)) {
        rv.push({type:ms[0], word:ms[0], off})
        off = reSep.lastIndex
        continue
      }

      reOp.lastIndex = off
      if (ms = reOp.exec(str)) {
        rv.push({type:'OP', word:ms[0], off})
        off = reOp.lastIndex
        continue
      }

      // not matched
      throw sprintf(_T('unexpected character around: %s'), str.slice(off, off + 6))
    }

    rv.push({type:'$', word:'end-of-line', off})
    return rv
  }

  const error = (et, tok) => {
    if (tok.type == '$') {
      throw sprintf(_T('%s: end of expression'), _T(et))
    } else {
      throw sprintf(_T('%s: %s at %s'), _T(et), tok.word, tok.off)
    }
  }
  const precedes = (op1, op2) => {
    const op1spec = opMap[op1]
    const op2spec = opMap[op2]
    if (op1spec.prec == op2spec.prec) {
      return op1spec.alignL
    } else {
      return (op1spec.prec > op2spec.prec)
    }
  }
  const parse = (ts) => {
    let index = 0
    const vars = []
    
    const term = () => {
      if (ts[index].type == 'VAR') {  // app or lookup
        const t = ts[index++]
        if (ts[index].type == '(') {  // app
          if (! funMap.hasOwnProperty(t.word)) {
            error('undefined function', t)
          }
          const ast = [t.word]
          index++
          ast.push(expr())
          while (ts[index].type == ',') {
            index++
            ast.push(expr())
          }
          if (ts[index].type != ')') {
            error('unexpected token', ts[index])
          }
          index++
          const fun = funMap[t.word]
          if (ast.length - 1 < fun.minArity) {
            error('too few arguments for', t)
          } else if (ast.length - 1 > fun.maxArity) {
            error ('too many arguments for', t)
          }
          return ast

        } else {  // lookup
          if (! findByProp('sym', t.word, vars)) {
            vars.push({sym:t.word})
          }
          return t.word
        }

      } else if (ts[index].type == 'LIT') {
        const lit = ts[index++]
        return lit.word

      } else if (ts[index].type == '(') {
        index++
        const ast = expr()
        if (ts[index].type != ')') {
          error('unexpected token', ts[index])
        }
        index++
        return ast

      } else {
        error('unexpected token', ts[index])
      }
    }
    const expr = () => {
      const stack = []
      stack.unshift(term())
      while (ts[index].type == 'OP') {
        const op = ts[index++]
        if (! opMap.hasOwnProperty(op.word)) {
          error('unexpected operator', op)
        }
        const rhs = term()
        if (stack.length >= 3 && precedes(stack[1], op.word)) {
          const xb = stack.shift()
          const xop = stack.shift()
          const xa = stack.shift()
          stack.unshift([xop, xa, xb])
          stack.unshift(op.word)
          stack.unshift(rhs)
        } else {
          stack.unshift(op.word)
          stack.unshift(rhs)
        }
      }
      while (stack.length > 1) {
        const bx = stack.shift()
        const opx = stack.shift()
        const ax = stack.shift()
        stack.unshift([opx, ax, bx])
      }
      return stack[0]
    }

    const ast = expr()
    if (ts[index].type != '$') {
      error('unexpected token', ts[index])
    }
    return {ast, vars}
  }

  return (str) => parse(tokenize(str))
}

const showAst = (ast) => {
  if (Array.isArray(ast)) {
    return '(' + ast.map(showAst).join(' ') + ')'
  } else {
    return "" + ast
  }
}
