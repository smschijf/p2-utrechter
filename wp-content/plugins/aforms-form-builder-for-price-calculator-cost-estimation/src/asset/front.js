
import { h, app } from 'hyperapp';
import { Core as YubinBangoCore } from 'yubinbango-core';
import number_format from 'locutus/php/strings/number_format';
import { tnOnCreate, tnOnRemove, Image, TextInput, TextArea, RadioButton, Checkbox, Select, Range, Echo, Button, InputGroup, Control, FileInput, File } from './front_component';


/*
 * Polyfills
 */
Math.trunc = Math.trunc || function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
}

/*
 * ===============================================================
 * utilities
 */

function sprintf(format) {
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

const nf = (amount) => {
  return number_format(amount, rule.taxPrecision, catalog['.'], catalog[',']);
}

const br = {nodeName:'br', attributes:{}, children:[]}

const _Tv = (x) => {
  x = _T(x)
  if (typeof x != 'string') return x

  const lines = x.split('\n')
  if (lines.length == 1) return lines[0]
  
  return lines.reduce((cur, line) => {
    return (cur.length == 0) ? [line] : [...cur, br, line]
  }, [])
}

const _T = (x) => {
  if (typeof x == 'undefined' || x === null) return null
  if (catalog.hasOwnProperty(x)) {
    return catalog[x]
  } else {
    console.log('TO TRANSLATE: ', x);
    return x;
  }
}

const evalExpr = (ast, vars, total, data, labels, env, expr) => {
  if (typeof ast == 'number' && ! isNaN(ast)) {
    // common easy case
    return ast
  }

  const guard = (val) => {
    if (! isFinite(val)) {  // either NaN or +-INF
      throw 'evaluation error: overflow in %s'
    }
    return val
  }
  const evl = (ast) => {
    if (typeof ast == 'number') {  // literal
      return ast
    } else if (typeof ast == 'string') {  // variable lookup
      const v = findByProp('sym', ast, vars)
      if (! v) {
        throw 'evaluation error: no-variable in %s'
      }
      if (v.ref == -1) return total
      const q = +findQuantity(data, v.ref, labels, env)
      if (isNaN(q)) {
        throw 'evaluation error: no-quantity in %s'
      }
      return q
    } else if (Array.isArray(ast)) {  // function application
      switch (ast[0]) {
        case '+': 
          return guard(evl(ast[1]) + evl(ast[2]))
        case '-': 
          return guard(evl(ast[1]) - evl(ast[2]))
        case '*': 
          return guard(evl(ast[1]) * evl(ast[2]))
        case '/': 
        {
          const b = evl(ast[2])
          if (b == 0) throw 'evaluation error: undefined-calculation in %s'
          return guard(evl(ast[1]) / b)
        }
        case '^': 
          return guard(evl(ast[1]) ** evl(ast[2]))
        case 'IFERROR': 
          try {
            return evl(ast[1])
          } catch (ex) {
            return evl(ast[2])
          }
        case 'ROUND': 
        {
          const a = evl(ast[1])
          const b = Math.pow(10, Math.trunc(evl(ast[2])))
          const c = a * b
          return guard((c < 0 ? -1*Math.round(-1*c) : Math.round(c)) / b)
        }
        case 'ROUNDUP':  // align to +- infinity
        {
          const a = evl(ast[1])
          const b = Math.pow(10, Math.trunc(evl(ast[2])))
          const c = a * b
          return guard((c < 0 ? Math.floor(c) : Math.ceil(c)) / b)
        }
        case 'ROUNDDOWN':  // align to zero
        {
          const a = evl(ast[1])
          const b = Math.pow(10, Math.trunc(evl(ast[2])))
          return guard(Math.trunc(a * b) / b)
        }
        case 'TRUNC':  // align to zero
        {
          const a = evl(ast[1])
          const b0 = ast.length == 3 ? Math.trunc(evl(ast[2])) : 0
          const b = Math.pow(10, b0)
          return guard(Math.trunc(a * b) / b)
        }
        case 'INT':  // align to negative infinity
        {
          const a = evl(ast[1])
          return guard(Math.floor(a))
        }
        case 'ABS': 
        {
          const a = evl(ast[1])
          return guard(a < 0 ? -1 * a : a)
        }
        case 'SIGN': 
        {
          const a = evl(ast[1])
          return guard(a < 0 ? -1 : a > 0 ? 1 : 0)
        }
        case 'QUOTIENT':  // align to zero
        {
          const b = evl(ast[2])
          if (b == 0) throw 'evaluation error: undefined-calculation in %s'
          return guard(Math.trunc(evl(ast[1]) / b))
        }
        case 'MOD':  // MOD(n, d) == n - d * INT(n / d)
        {
          const d = evl(ast[2])
          if (d == 0) throw 'evaluation error: undefined-calculation in %s'
          const n = evl(ast[1])
          return guard(n - d * Math.floor(n/d))
        }
        case 'MIN': 
        {
          let a = evl(ast[1])
          for (let i = 2; i < ast.length; i++) {
            const b = evl(ast[i])
            if (b < a) a = b
          }
          return a
        }
        case 'MAX': 
        {
          let a = evl(ast[1])
          for (let i = 2; i < ast.length; i++) {
            const b = evl(ast[i])
            if (b > a) a = b
          }
          return a
        }
        case 'SWITCH':  // [SWITCH, x, m1, e1, ..., else?]
        {
          const a = evl(ast[1])
          let i = 2
          for (; i < ast.length - 1; i += 2) {
            const b = evl(ast[i])
            if (a == b) return evl(ast[i + 1])
          }
          if (i != ast.length) {
            // there else clause
            return evl(ast[i])
          } else {
            throw 'evaluation error: no matching clause in %s'
          }
        }
        default: 
          throw 'evaluation error: no-function in %s'
      }
    } else {  // unkdnown
      throw 'evaluation error: unknown-term in %s'
    }
  }

  try {
    return evl(ast)
  } catch (ex) {
    const msg = sprintf(_T(ex), expr)
    if (mode == 'preview') {
      alert(msg)
    } else {
      console.log('[AForms] '+msg)
    }
    return NaN
  }
}

const scrollTo = (id) => {
  const pos = document.documentElement.scrollTop || document.body.scrollTop;
  const r = document.getElementById(id).getBoundingClientRect()
  const posBot = r.top + pos - 100
  const posTop = r.top + pos - 150
  if (posTop > pos) {
    if (behavior.smoothScroll) {
      const diff = Math.max((posTop - pos) / 8, 4)
      window.requestAnimationFrame(() => scrollTo(id))
      window.scrollTo(0, pos + diff)
    } else {
      window.scrollTo(0, posTop)
    }
  } else if (posBot < pos) {
    if (behavior.smoothScroll) {
      const diff = Math.max((pos - posBot) / 8, 4)
      window.requestAnimationFrame(() => scrollTo(id))
      window.scrollTo(0, pos - diff)
    } else {
      window.scrollTo(0, posBot)
    }
  }
};

const focusErrorInput = (prefix, ms) => {
  const ids = Object.keys(ms)
  if (ids.length == 0) return;
  const name = '.'+prefix+ids[0]
  let elem = document.querySelector(name);
  if (! elem) {
    elem = document.querySelector('.wq-Button.wq-belongs-wnavbase')
  }
  console.log('focusErrorInput', prefix, ids[0], elem)
  if (elem != null) {
    elem.focus();
    return;
  }
}

const findByProp = (name, val, arr) => {
  const len = arr.length
  for (let i = 0; i < len; i++) {
    if (arr[i][name] == val) return arr[i]
  }
  return undefined
}

const findIndexByProp = (name, val, arr) => {
  const len = arr.length
  for (let i = 0; i < len; i++) {
    if (arr[i][name] == val) return i
  }
  return -1
}

const satisfied = (set, specs) => {
  for (let prop in specs) {
    if (specs[prop] != set.hasOwnProperty(prop)) return false
  }
  return true
}

const extend = (set, specs) => {
  const copy = {...set}
  for (let prop in specs) {
    if (specs[prop]) {
      copy[prop] = true
    } else {
      delete copy[prop]
    }
  }
  return copy
}

const exclude = (set, prop) => {
  const copy = {...set}
  delete copy[prop]
  return copy
}

const branchNo = (name, sep) => {
  const off = name.lastIndexOf(sep)
  const fragment = name.slice(off + 1)
  return parseInt(fragment)
}

const replaceElement = (arr, idx, value) => {
  const arr2 = [...arr]
  arr2[idx] = value
  return arr2
}

const indexOf = (e, lis) => {
  const len = lis.length
  for (let i = 0; i < len; i++) {
    if (lis[i] == e) return i
  }
  return -1
}

const reduceHash = (f, cur, hash) => {
  for (let key in hash) {
    cur = f(cur, key, hash[key])
  }
  return cur
}

/*const mapHash = (f, hash) => {
  const rv = {}
  for (let key in hash) {
    rv[key] = f(key, hash[key])
  }
  return rv
}*/

const emptyString = (s) => (s == "")

const fromTo = (from, to, step) => {
  const arr = []
  for (let i = from; i <= to; i += step) {
    arr.push(i)
  }
  return arr
}

const normalizePrice = (rule, price) => {
  price = price * Math.pow(10, rule.taxPrecision)
  switch (rule.taxNormalizer) {
    case 'trunc': price = Math.trunc(price); break;
    case 'floor': price = Math.floor(price); break;
    case 'ceil':  price = Math.ceil(price); break;
    case 'round': price = Math.round(price); break;
  }
  return price / Math.pow(10, rule.taxPrecision)
}

const compare2 = (value, lower, lowerIncluded, higher, higherIncluded) => {
  if (lower != null) {
    if (lowerIncluded) {
      if (value < lower) return false;
    } else {
      if (value <= lower) return false;
    }
  }
  if (higher != null) {
    if (higherIncluded) {
      if (value > higher) return false;
    } else {
      if (value >= higher) return false;
    }
  }
  return true;
}

const submit = (data, k) => {
  //console.log('submit', submitType);
  jQuery.ajax({
    type: "post", 
    url: submitUrl, 
    data: JSON.stringify(data), 
    contentType: 'application/json',
    success: function(response) {
      k(response)
    }, 
    error: function (xhr) {
      const msg = (xhr.status === 403) ? _T('Failed to submit due to authorization failure.') : _T('Failed to submit due to some error.')
      window.alert(msg)
    }, 
    dataType: 'json'
  });
}

const submitCustom = (data, k, id) => {
  const url = customUrl.replace('placeholder', id)
  jQuery.ajax({
    type: "post", 
    url, 
    data: JSON.stringify(data), 
    contentType: 'application/json', 
    success: function (response) {
      k(response)
    }, 
    error: function (xhr) {
      const msg = (xhr.status === 403) ? _T('Failed to submit due to authorization failure.') : _T('Failed to submit due to some error.')
      window.alert(msg)
    }, 
    dataType: 'json'
  });
}

const complementAddress = (zip, k) => {
  new YubinBangoCore(zip.replace('-', ''), k)
}

const findQuantity = (inputs, qid, labels, env) => {
  if (qid == -1) return 1
  const item = findByProp("id", qid, form.detailItems)
  if (item.type == 'Quantity' || item.type == 'Slider') {
    if (! satisfied(labels, item.depends)) return NaN
    return inputs.hasOwnProperty(qid) ? inputs[qid] : item.initial
  } else if (item.type == 'AutoQuantity') {
    return env.hasOwnProperty(qid) ? env[qid] : NaN
  }
}

/*
 * ===============================================================
 * view 
 */

const Option = (
    {
      type, 
      checked, 
      labels, 
      selectid, 
      option, 
      onchange, 
      navigator
    }) => {
  const id = `wq-option-detail-${selectid}-${option.id}`
  const iname = `detail-${selectid}`
  const enabled = satisfied(labels, option.depends)
  return (
    <div class={`wq-Option wq-belongs-${navigator} wq-belongs-selector-${selectid} ${option.image ? '' : 'wq-media-empty'}`} key={id} id={id+'-wrapper'}>
      <input type={type} id={id} checked={checked} class={`wq--input wq_${iname} wq-type-${type} ${checked ? 'wq-is-selected' : ''}`} name={iname} onchange={onchange} data-path={selectid+'/'+option.id} value="true" disabled={! enabled} />
      <label for={id} class="wq--label">
        <div class="wq--media">
          <Image src={option.image} scaling="center" xclass={`wq-belongs-${navigator} wq-belongs-option`} />
        </div>
        <div class="wq--main">
          <div class="wq--name">{option.name}</div>
          <div class="wq--note">{option.note}</div>
          <div class="wq--prices">
            {typeof option.normalPrice == "number" ? (<span class="wq--normalPrice">{pricePrefix}{nf(option.normalPrice)}{priceSuffix}</span>) : null}
            {typeof option.price == "number" ? (<span class="wq--price">{pricePrefix}{nf(option.price)}{priceSuffix}</span>) : null}
          </div>
        </div>
        {['SALE', 'RECOMMENDED'].map((r,i) => option.ribbons[r] ? (
          <div class={`wq--ribbon wq-ribbon-${i+1}`}><span>{_Tv(r)}</span></div>
        ) : null)}
      </label>
    </div>
  )
}

const QuantOption = (
    {
      type, 
      value, 
      labels, 
      selectid, 
      option, 
      onchange, 
      navigator
    }) => {
  const id = `wq-quantoption-detail-${selectid}-${option.id}`
  const iname = `detail-${selectid}`
  const enabled = satisfied(labels, option.depends)
  return (
    <div class={`wq-Option wq-belongs-${navigator} wq-belongs-selector-${selectid} wq-type-QuantOption ${option.image ? '' : 'wq-media-empty'}`} key={id} id={id+'-wrapper'}>
      <select id={id} class={`wq--select wq_${iname} ${typeof value == 'string' || typeof value == 'number' ? 'wq-is-selected' : ''} wq-type-${type}`} name={iname} onchange={onchange} disabled={!enabled} data-path={selectid+'/'+option.id}>
        <option value="">{_T('Deselect')}</option>
        {fromTo(option.minimum, option.maximum, option.step).map(v => {
          return (
            <option value={v} selected={v == value}>{v} {option.suffix}</option>
          )
        })}
      </select>
      <label for={id} class="wq--label">
        <div class="wq--media">
          <Image src={option.image} scaling="center" xclass={`wq-belongs-${navigator} wq-belongs-option`} />
        </div>
        <div class="wq--main">
          <div class="wq--name">{option.name}</div>
          <div class="wq--note">{option.note}</div>
          <div class="wq--prices">
            {typeof option.normalPrice == "number" ? (<span class="wq--normalPrice">{pricePrefix}{nf(option.normalPrice)}{priceSuffix}</span>) : null}
            {typeof option.price == "number" ? (<span class="wq--price">{pricePrefix}{nf(option.price)}{priceSuffix}</span>) : null}
          </div>
          {typeof value == 'string' || typeof value == 'number' ? (<div class="wq--quantity">{value}</div>) : null}
        </div>
        {['SALE', 'RECOMMENDED'].map((r,i) => option.ribbons[r] ? (
          <div class={`wq--ribbon wq-ribbon-${i+1}`}><span>{_Tv(r)}</span></div>
        ) : null)}
      </label>
    </div>
  )
}

const Selector = (
    {
      selector, 
      onoptionchange, 
      selectedOptions, 
      labels, 
      message, 
      navigator
    }
) => {
  const id = `wq-selector-detail-${selector.id}`
  const type = selector.multiple ? 'checkbox' : 'radio'
  return (
    <div class={`wq-Selector wq-lct-enabled ${!!message ? 'wq-is-invalid' : ''} wq-belongs-${navigator}`} key={id} id={id} oncreate={tnOnCreate} onremove={tnOnRemove}>
      <div class="wq--head">
        <div class="wq--media">
          <Image src={selector.image} scaling="center" xclass={`wq-belongs-${navigator} wq-belongs-selector`} />
        </div>
        <div class="wq--main">
          <div class="wq--name">{selector.name}</div>
          <div class="wq--note">{selector.note}</div>
        </div>
        {(message) ? (<div class="wq--message wq-lct-enabled" oncreate={tnOnCreate} onremove={tnOnRemove}>{_Tv(message)}</div>) : null}
      </div>
      <div class="wq--body">
        {selector.options.map((option, i) => {
          if (option.type == 'Option') {
            return (
              <Option type={type} checked={selectedOptions.hasOwnProperty(option.id)} selectid={selector.id} onchange={onoptionchange} option={option} labels={labels} navigator={navigator} />
            )
          } else {  // QuantOption
            return (
              <QuantOption type={type} value={selectedOptions[option.id]} selectid={selector.id} onchange={onoptionchange} option={option} labels={labels} navigator={navigator} />
            )
          }
        })}
      </div>
    </div>
  )
}

const Quantity = (
    {
      quantity, 
      value, 
      message, 
      oninput, 
      onblur, 
      navigator
    }
) => {
  const id = `wq-quantity-detail-${quantity.id}`
  const iname = `detail-${quantity.id}`
  return (
    <div class={`wq-Quantity wq-lct-enabled ${!!message ? 'wq-is-invalid' : ''} wq-belongs-${navigator}`} id={id} oncreate={tnOnCreate} onremove={tnOnRemove}>
      <div class="wq--head">
        <div class="wq--media">
          <Image src={quantity.image} scaling="center" xclass={`wq-belongs-${navigator} wq-belongs-quantity`} />
        </div>
        <div class="wq--main">
          <div class="wq--name">{quantity.name}</div>
          <div class="wq--note">{quantity.note}</div>
        </div>
        {(message) ? (<div class="wq--message wq-lct-enabled" oncreate={tnOnCreate} onremove={tnOnRemove}>{_Tv(message)}</div>) : null}
      </div>
      <div class="wq--body">
        <InputGroup gutter="mini">
          <TextInput type="number" size="small" name={iname} value={value} placeholder={null} invalid={!!message} oninput={oninput} onblur={onblur} />
          {quantity.suffix ? (<span class="wq--suffix">{quantity.suffix}</span>) : null}
        </InputGroup>
      </div>
    </div>
  )
}

const Slider = (
    {
      slider, 
      value, 
      message, 
      oninput, 
      onchange, 
      navigator
    }
) => {
  const id = `wq-slider-detail-${slider.id}`
  const iname = `detail-${slider.id}`
  return (
    <div class={`wq-Slider wq-lct-enabled ${!!message ? 'wq-is-invalid' : ''} wq-belongs-${navigator}`} id={id} oncreate={tnOnCreate} onremove={tnOnRemove}>
      <div class="wq--head">
        <div class="wq--media">
          <Image src={slider.image} scaling="center" xclass={`wq-belongs-${navigator} wq-belongs-slider`} />
        </div>
        <div class="wq--main">
          <div class="wq--name">{slider.name}</div>
          <div class="wq--note">{slider.note}</div>
        </div>
        {(message) ? (<div class="wq--message wq-lct-enabled" oncreate={tnOnCreate} onremove={tnOnRemove}>{_Tv(message)}</div>) : null}
      </div>
      <div class="wq--body">
        <Range name={iname} value={value} max={slider.maximum} min={slider.minimum} step={slider.step} invalid={!!message} suffix={slider.suffix} oninput={oninput} onchange={onchange} />
      </div>
    </div>
  )
}

const HNavigator = (
    {
      data, 
      onoptionchange, 
      ontextinput, 
      ontextblur, 
      onrangeblur, 
      labels, 
      messages
    }, children) => {
  const id = 'wq-hnavigator'
  return (
    <div class="wq-HNavigator" id={id} key={id}>
      {children}
      <div class="wq--items">
        {form.detailItems.map((item) => {
          const message = messages.hasOwnProperty(item.id) ? messages[item.id] : null
          if (item.type == 'Selector') {
            if (item.options.some(option => satisfied(labels, option.depends))) {
              const selectedOptions = data.hasOwnProperty(item.id) ? data[item.id] : {}
              return (
                <Selector selector={item} onoptionchange={onoptionchange} selectedOptions={selectedOptions} labels={labels} message={message} navigator="hnavigator" />
              )
            } else {
              return null
            }
          } else if (item.type == 'Quantity') {
            if (satisfied(labels, item.depends)) {
              const value = data.hasOwnProperty(item.id) ? data[item.id] : ''
              return (
                <Quantity quantity={item} value={value} message={message} oninput={ontextinput} onblur={ontextblur} navigator="hnavigator" />
              )
            } else {
              return null
            }
          } else if (item.type == "Slider") {
            if (satisfied(labels, item.depends)) {
              const value = data.hasOwnProperty(item.id) ? data[item.id] : ''
              return (
                <Slider slider={item} value={value} message={message} navigator="hnavigator" oninput={ontextinput} onchange={onrangeblur} />
              )
            } else {
              return null
            }
          } else {
            return null;
          }
        })}
      </div>
    </div>
  )
}

const suspendOtherSurfaces = () => {
  document.documentElement.classList.add('wq-x-suspended')
}
const resumeOtherSurfaces = () => {
  document.documentElement.classList.remove('wq-x-suspended')
}
const overlayOnCreate = (el) => {
  suspendOtherSurfaces()
  tnOnCreate(el)
}
const overlayOnRemove = (el, done) => {
  const myDone = () => {
    resumeOtherSurfaces()
    done()
  }
  tnOnRemove(el, myDone)
}
const WNavigator = (
    {
      data, 
      onoptionchange, 
      ontextinput, 
      ontextblur, 
      onrangeblur, 
      labels, 
      messages, 
      onWizardNext, 
      onWizardPrev, 
      onWizardOpen, 
      onWizardClose, 
      current, 
      current2, 
      open, 
      flipped
    }, children) => {
  const id = 'wq-wnavigator'
  const length = form.detailItems.length
  const item = (open && current < length) ? form.detailItems[current] : null
  const item2 = (open && current2 < length) ? form.detailItems[current2] : null
  const selectedOptions = (open && current < length) ? (data.hasOwnProperty(item.id) ? data[item.id] : {}) : null
  const message = (open && current < length) ? (messages.hasOwnProperty(item.id) ? messages[item.id] : null) : null
  const messageValues = Object.values(messages)
  const originalOnoptionchange = onoptionchange
  if (item && item.type == "Selector" && !item.multiple) {
    onoptionchange = (ev) => {
      window.setTimeout(() => {
        onWizardNext()
      }, 400)
      return originalOnoptionchange(ev)
    }
  }
  return (
    <div class={`wq-WNavigator ${open ? 'wq-is-active' : ''}`} key={id} id={id}>
      <div class="wq--base">
        <Button type="primary" onclick={onWizardOpen} xclass="wq-belongs-wnavbase">{_Tv('Start Order')}</Button>
        {messageValues.length > 0 ? (
          <div class="wq--message wq-lct-enabled" oncreate={tnOnCreate} onremove={tnOnRemove}>{_Tv(messageValues[0])}</div>
        ) : null}
        {/*Object.keys(messages).length > 0 ? (
          <div class="wq--message wq-lct-enabled" oncreate={tnOnCreate} onremove={tnOnRemove}>{_Tv('Your selection is insufficient.')}</div>
        ) : null*/}
      </div>
      {open ? (
        <div class={`wq--overlay wq-lct-enabled`} id="wq-wnav-overlay" key="wnav-overlay" oncreate={overlayOnCreate} onremove={overlayOnRemove}>
          <div class={`wq--dialog`} key="wnav-dialog">
            {children}
            <div class={`wq--main ${flipped ? 'wq-is-flipped' : ''}`} key="wnav-main">
              <div class="wq--slide wq-lct-enabled" oncreate={tnOnCreate} onremove={tnOnRemove} key={`slide-${current}`} id={`slide-${current}`}>
                {item && item.type == "Selector" ? (
                  <Selector selector={form.detailItems[current]} onoptionchange={onoptionchange} selectedOptions={selectedOptions} labels={labels} message={message} navigator="wnavigator"></Selector>
                ) : null}
                {item && item.type == "Quantity" ? (
                  <Quantity quantity={item} value={data[item.id]} message={message} oninput={ontextinput} onblur={ontextblur} navigator="wnavigator" />
                ) : null}
                {item && item.type == "Slider" ? (
                  <Slider slider={item} value={data[item.id]} message={message} navigator="wnavigator" oninput={ontextinput} onchange={onrangeblur} />
                ) : null}
              </div>
            </div>
            <div class="wq--action" key="wnav-action">
              <Button type="normal" onclick={onWizardClose} xclass="wq-belongs-wnavdialog wq-for-closewizard">{_Tv('Close')}</Button>
              <div class="wq--spacer" />
              <Button type="normal" onclick={onWizardPrev} xclass="wq-belongs-wnavdialog wq-for-backwizard" disabled={(findPrevIndex(current2, data) == -1)}>{_Tv('Previous')}</Button>
              <Button typr="normal" onclick={onWizardNext} disabled={current2 == length} xclass="wq-belongs-wnavdialog wq-for-forwardwizard">{_Tv('Next')}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  ) 
}

const Monitor = (
    {
      detailsState, 
      monitorPos, 
      confirming, 
      spShown, 
      onHide
    }) => {
  const id = `wq-monitor`
  const doSidebar = wqData.form.navigator == 'horizontal' && wqData.sidebarSelector && !confirming
  const style = doSidebar ? {left:monitorPos.left+'px', width:monitorPos.width+'px'} : {}
  return (
    <div class={`wq-Monitor ${confirming ? 'wq-is-confirming' : ''} ${spShown ? 'wq-is-spshown' : ''} ${doSidebar ? 'wq-is-sidebar' : ''} ${doSidebar ? ('wq-sticks-'+monitorPos.v) : ''}`} id={id} key={id} style={style}>
      <div class="wq--header">
        <div class="wq--title">{_T('Quotation Details')}</div>
        <div class="wq--menu">
          <Button type="normal" onclick={onHide} xclass="wq-belongs-monmenu wq-for-hidemonitor">{_T('Hide Monitor')}</Button>
        </div>
      </div>
      <div class="wq--entries">
        <div class="wq--entry wq-for-header">
          <div class="wq--prop wq-for-no">{_Tv('No')}</div>
          <div class="wq--prop wq-for-category">{_Tv('Category')}</div>
          <div class="wq--prop wq-for-entry">{_Tv('Entry')}</div>
          <div class="wq--prop wq-for-normalUnitPrice">{_T('Regular Unit Price')}</div>
          <div class="wq--prop wq-for-unitPrice">{_Tv('Unit Price')}</div>
          <div class="wq--prop wq-for-quantity">{_Tv('Quantity')}</div>
          <div class="wq--prop wq-for-price">{_Tv('Price')}</div>
          {!rule.taxIncluded && (<div class="wq--prop wq-for-taxClass">{_Tv('Tax Class')}</div>)}
        </div>
        {detailsState.details.map((detail, i) => {
          const id = `wq-monitor-entry-${detail.key}`
          return (
            <div class="wq--entry wq-for-entry wq-lct-enabled" key={id} id={id} oncreate={tnOnCreate} onremove={tnOnRemove}>
              <div class="wq--prop wq-for-no">{i + 1}</div>
              <div class="wq--prop wq-for-category">{detail.category}</div>
              <div class="wq--prop wq-for-entry">{detail.name}</div>
              <div class="wq--prop wq-for-normalUnitPrice">{typeof detail.normalUnitPrice == 'number' ? nf(detail.normalUnitPrice) : null}</div>
              <div class="wq--prop wq-for-unitPrice">{nf(detail.unitPrice)}</div>
              <div class="wq--prop wq-for-quantity"><span class="wq--simpleDisplay">{detail.quantity}</span><span class="wq--independentDisplay">{sprintf(_T('x%s'), detail.quantity)}</span></div>
              <div class="wq--prop wq-for-price">{nf(normalizePrice(rule, detail.unitPrice * detail.quantity))}</div>
              {!rule.taxIncluded && (<div class="wq--prop wq-for-taxClass">{detail.taxRate === null ? sprintf(_Tv('(common %s%% applied)'), ""+rule.taxRate) : sprintf(_Tv('(%s%% applied)'), detail.taxRate)}</div>)}
            </div>
          )
        })}
      </div>
      {rule.taxIncluded 
        ? (() => {
          return (
            <div class="wq--footer">
              <div class="wq--entry wq-for-total">
                <div class="wq--prop wq-for-name">{_Tv('Total')}</div>
                <div class="wq--prop wq-for-normalValue" key={detailsState.normalTotal}>{pricePrefix + nf(detailsState.normalTotal) + priceSuffix}</div>
                <div class="wq--prop wq-for-value">{pricePrefix}<span><span class="wq-lct-enabled" id={detailsState.total} key={detailsState.total} oncreate={tnOnCreate} onremove={tnOnRemove}>{nf(detailsState.total)}</span></span>{priceSuffix}</div>
              </div>
            </div>
          )
        })() : (() => {
          const subtotal = detailsState.total
          const totalwt = reduceHash((cur, key, tax) => {
            return cur + tax
          }, subtotal, detailsState.taxes)
          const defaultTax = detailsState.taxes.hasOwnProperty('') ? detailsState.taxes[''] : null
          return (
            <div class="wq--footer">
              <div class="wq--entry wq-for-subtotal">
                <div class="wq--prop wq-for-name">{_Tv('Subtotal')}</div>
                <div class="wq--prop wq-for-normalValue" key={detailsState.normalTotal}>{pricePrefix + nf(detailsState.normalTotal) + priceSuffix}</div>
                <div class="wq--prop wq-for-value">{pricePrefix}<span><span class="wq-lct-enabled" id={subtotal} key={subtotal} oncreate={tnOnCreate} onremove={tnOnRemove}>{nf(subtotal)}</span></span>{priceSuffix}</div>
              </div>
              {defaultTax !== null ? (
                <div class="wq--entry wq-for-tax wq-rate-common">
                  <div class="wq--prop wq-for-name">{sprintf(_Tv('Tax (common %s%%)'), ""+rule.taxRate)}</div>
                  <div class="wq--prop wq-for-normalValue"></div>
                  <div class="wq--prop wq-for-value">{pricePrefix}<span><span class="wq-lct-enabled" id={defaultTax} key={defaultTax} oncreate={tnOnCreate} onremove={tnOnRemove}>{nf(defaultTax)}</span></span>{priceSuffix}</div>
                </div>
              ) : null}
              {reduceHash((cur, key, tax) => {
                if (key === "") return cur
                return [...cur, 
                  <div class="wq--entry wq-for-tax wq-rate-individual">
                    <div class="wq--prop wq-for-name">{sprintf(_Tv('Tax (%s%%)'), ""+key)}</div>
                    <div class="wq--prop wq-for-normalValue"></div>
                    <div class="wq--prop wq-for-value">{pricePrefix}<span><span class="wq-lct-enabled" id={tax} key={tax} oncreate={tnOnCreate} onremove={tnOnRemove}>{nf(tax)}</span></span>{priceSuffix}</div>
                  </div>
                ]
              }, [], detailsState.taxes)}
              <div class="wq--entry wq-for-total">
                <div class="wq--prop wq-for-name">{_Tv('Total')}</div>
                <div class="wq--prop wq-for-normalValue"></div>
                <div class="wq--prop wq-for-value">{pricePrefix}<span><span class="wq-lct-enabled" id={totalwt} key={totalwt} oncreate={tnOnCreate} onremove={tnOnRemove}>{nf(totalwt)}</span></span>{priceSuffix}</div>
              </div>
            </div>
          )
        })()
      }
    </div>
  )
}

const attrItem_table = {}
const MSG_REQUIRED = 'Input here'
const MSG_INVALID = 'Invalid'
const MSG_TOCHECK = 'Check here'
const MSG_TOSELECT = 'Select here'
const MSG_DIFFERENT = 'Repeat here'
const MSG_TOOSMALL = 'Too small'
const MSG_TOOLARGE = 'Too large'
const MSG_HIRAGANA = 'Input in Hiragana'
const MSG_KATAKANA = 'Input in Katakana'
const MSG_UPLOADING = 'Wait for upload'

// {type, id, name, required, note, divided}
attrItem_table.Name = {}
attrItem_table.Name.view = (item, state, actions) => {
  const id = `wq-attr-name-${item.id}`
  if (! item.divided) {
    const name = `name-${item.id}`
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass={`wq-belongs-attr wq-for-name`} key={id}>
        <TextInput type="text" size="normal" name={name} placeholder={_T('Your Name')} value={state.value} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-name wq_attr-${item.id}`} />
      </Control>
    )
  } else {
    const names = [`name-${item.id}-0`, `attr-${item.id}-1`]
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass={`wq-belongs-attr wq-for-name wq-is-divided`} key={id}>
        <InputGroup gutter="mini" xclass={`wq-belongs-attr wq-belongs-name`}>
          <TextInput type="text" size="small" name={names[0]} placeholder={_T('First Name')} value={state.value[0]} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-name wq_attr-${item.id}`} />
          <TextInput type="text" size="small" name={names[1]} placeholder={_T('Last Name')} value={state.value[1]} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-name wq_attr-${item.id}`} />
        </InputGroup>
      </Control>
    )
  }
}
attrItem_table.Name.initialState = (item) => {
  if (item.divided) {
    return {value:["", ""], message:null}
  } else {
    return {value:"", message:null}
  }
}
attrItem_table.Name.compile = (item, state) => {
  if (item.divided) {
    return state.value.join(' ')
  } else {
    return state.value
  }
}
attrItem_table.Name.hiraganaPattern = /^([ぁ-ん]|ー| |　)+$/
attrItem_table.Name.katakanaPattern = /^([ァ-ン]|ー| |　)+$/
attrItem_table.Name.validate = (item, state) => {
  if (item.divided) {
    if (!item.required && state.value[0] == "" && state.value[1] == "") {
      // thru
    } else if (state.value[0] == "" || state.value[1] == "") {
      return {value:state.value, message:MSG_REQUIRED}
    } else if (item.pattern == 'hiragana' && (!state.value[0].match(attrItem_table.Name.hiraganaPattern) || !state.value[1].match(attrItem_table.Name.hiraganaPattern))) {
      return {value:state.value, message:MSG_HIRAGANA}
    } else if (item.pattern == 'katakana' && (!state.value[0].match(attrItem_table.Name.katakanaPattern) || !state.value[1].match(attrItem_table.Name.katakanaPattern))) {
      return {value:state.value, message:MSG_KATAKANA}
    }
    return {value:state.value, message:null}
  } else {
    if (!item.required && state.value == "") {
      // thru
    } else if (state.value == "") {
      return {value:state.value, message:MSG_REQUIRED}
    } else if (item.pattern == 'hiragana' && !state.value.match(attrItem_table.Name.hiraganaPattern)) {
      return {value:state.value, message:MSG_HIRAGANA}
    } else if (item.pattern == 'katakana' && !state.value.match(attrItem_table.Name.katakanaPattern)) {
      return {value:state.value, message:MSG_KATAKANA}
    }
    return {value:state.value, message:null}
  }
}
attrItem_table.Name.createActions = (item) => {
  if (item.divided) {
    return {
      oninput: (ev) => (state, _actions) => {
        const idx = branchNo(ev.currentTarget.name, '-')
        return {...state, value:replaceElement(state.value, idx, ev.currentTarget.value)}
      }, 
      onblur: (ev) => (state, _actions) => {
        const idx = branchNo(ev.currentTarget.name, '-')
        if (idx == 1) {
          if (!item.required && state.value[0] == "" && state.value[1] == "") {
            // thru
          } else if (state.value[0] == "" || state.value[1] == "") {
            return {value:state.value, message:MSG_REQUIRED}
          } else if (item.pattern == 'hiragana' && (!state.value[0].match(attrItem_table.Name.hiraganaPattern) || !state.value[1].match(attrItem_table.Name.hiraganaPattern))) {
            return {value:state.value, message:MSG_HIRAGANA}
          } else if (item.pattern == 'katakana' && (!state.value[0].match(attrItem_table.Name.katakanaPattern) || !state.value[1].match(attrItem_table.Name.katakanaPattern))) {
            return {value:state.value, message:MSG_KATAKANA}
          }
        }
        return {...state, message:null}
      }
    }
  } else {
    return {
      oninput: (ev) => (state, _actions) => {
        return {value:ev.currentTarget.value, message:state.message}
      }, 
      onblur: (ev) => ({value, _message}, _actions) => {
        if (!item.required && value == "") {
          // thru
        } else if (value == "") {
          return {value, message:MSG_REQUIRED}
        } else if (item.pattern == 'hiragana' && !state.value.match(attrItem_table.Name.hiraganaPattern)) {
          return {value:state.value, message:MSG_HIRAGANA}
        } else if (item.pattern == 'katakana' && !state.value.match(attrItem_table.Name.katakanaPattern)) {
          return {value:state.value, message:MSG_KATAKANA}
        }
        return {value, message:null}
      }
    }
  }
}

// {type, id, name, required, note, repeated}
attrItem_table.Email = {}
attrItem_table.Email.view = (item, state, actions) => {
  const id = `wq-attr-email-${item.id}`
  if (item.repeated) {
    const names = [`email-${item.id}-0`, `email-${item.id}-1`]
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-email" key={id}>
        <TextInput type="text" size="full" name={names[0]} placeholder={_T('info@example.com')} value={state.value[0]} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-email wq_attr-${item.id}`} />
        <TextInput type="text" size="full" name={names[1]} placeholder={_T('Confirm again')} value={state.value[1]} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-email wq_attr-${item.id}`} />
      </Control>
    )
  } else {
    const name = `email-${item.id}`
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-email" key={id}>
        <TextInput type="text" size="full" name={name} placeholder={_T('info@example.com')} value={state.value} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-email wq_attr-${item.id}`} />
      </Control>
    )
  }
}
attrItem_table.Email.pattern = /^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/
attrItem_table.Email.initialState = (item) => {
  if (item.repeated) {
    return {value:["", ""], message:null}
  } else {
    return {value:"", message:null}
  }
}
attrItem_table.Email.compile = (item, state) => {
  if (item.repeated) {
    return state.value[0]
  } else {
    return state.value
  }
}
attrItem_table.Email.validate = (item, state) => {
  if (item.repeated) {
    if (!item.required && state.value[0] == "" && state.value[1] == "") {
      // thru
    } else if (state.value[0] == "" || state.value[1] == "") {
      return {...state, message:MSG_REQUIRED}
    } else if (!state.value[0].match(attrItem_table.Email.pattern)) {
      return {...state, message:MSG_INVALID}
    } else if (state.value[0] != state.value[1]) {
      return {...state, message:MSG_DIFFERENT}
    }
    return {...state, message:null}
  } else {
    if (!item.required && state.value == "") {
      // thru
    } else if (state.value == "") {
      return {value:state.value, message:MSG_REQUIRED}
    } else if (!state.value.match(attrItem_table.Email.pattern)) {
      return {value:state.value, message:MSG_INVALID}
    }
    return {value:state.value, message:null}
  }
}
attrItem_table.Email.createActions = (item) => {
  if (item.repeated) {
    return {
      oninput: (ev) => (state, _actions) => {
        const idx = branchNo(ev.currentTarget.name, '-')
        return {...state, value:replaceElement(state.value, idx, ev.currentTarget.value)}
      }, 
      onblur: (ev) => ({value, _message}, _actions) => {
        const idx = branchNo(ev.currentTarget.name, '-')
        if (idx == 1) {
          if (!item.required && value[0] == "" && value[1] == "") {
            // thru
          } else if (value[0] == "" || value[1] == "") {
            return {value, message:MSG_REQUIRED}
          } else if (!value[0].match(attrItem_table.Email.pattern)) {
            return {value, message:MSG_INVALID}
          } else if (value[0] != value[1]) {
            return {value, message:MSG_DIFFERENT}
          }
        }
        return {value, message:null}
      }
    }
  } else {
    return {
      oninput: (ev) => (state, _actions) => {
        return {value:ev.currentTarget.value, message:state.message}
      }, 
      onblur: (ev) => ({value, _message}, _actions) => {
        if (!item.required && value == "") {
          // thru
        } else if (value == "") {
          return {value, message:MSG_REQUIRED}
        } else if (!value.match(attrItem_table.Email.pattern)) {
          return {value, message:MSG_INVALID}
        }
        return {value, message:null}
      }
    }
  }
}

// {type, id, name, divided, required, note}
attrItem_table.Tel = {}
attrItem_table.Tel.view = (item, state, actions) => {
  const id = `wq-attr-tel-${item.id}`
  if (item.divided) {
    const name = `tel-${item.id}`
    const phs = _T('03-1111-2222').split('-')
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-tel" key={id}>
        <InputGroup xclass="wq-belongs-attr wq-belongs-tel">
          <TextInput type="tel" size="nano" name={name+'-0'} placeholder={phs[0]} value={state.value[0]} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-tel wq_attr-${item.id}`} />
          <span>-</span>
          <TextInput type="tel" size="mini" name={name+'-1'} placeholder={phs[1]} value={state.value[1]} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-tel wq_attr-${item.id}`} />
          <span>-</span>
          <TextInput type="tel" size="mini" name={name+'-2'} placeholder={phs[2]} value={state.value[2]} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-tel wq_attr-${item.id}`} />
        </InputGroup>
      </Control>
    )
  } else {
    const name = `tel-${item.id}`
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-tel" key={id}>
        <TextInput type="tel" size="small" name={name} placeholder={_T('03-1111-2222')} value={state.value} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-tel wq_attr-${item.id}`} />
      </Control>
    )
  }
}
attrItem_table.Tel.initialState = (item) => {
  if (item.divided) {
    return {value:["", "", ""], message:null}
  } else {
    return {value:"", message:null}
  }
}
attrItem_table.Tel.compile = (item, state) => {
  if (item.divided) {
    return (state.value[0] == '') ? '' : state.value.join('-')
  } else {
    return state.value
  }
}
attrItem_table.Tel.validate = (item, state) => {
  if (item.divided) {
    if (!item.required && state.value.every(emptyString)) {
      // thru
    } else if (state.value.some(emptyString)) {
      return {value:state.value, message:MSG_REQUIRED}
    } else if (! state.value.join('').match(/^[0-9]+$/)) {
      return {value:state.value, message:MSG_INVALID}
    }
    return {value:state.value, message:null}
  } else {
    if (!item.required && state.value == "") {
      // thru
    } else if (state.value == "") {
      return {value:state.value, message:MSG_REQUIRED}
    } else if (! state.value.match(/^[0-9-]+$/)) {
      return {value:state.value, message:MSG_INVALID}
    }
    return {value:state.value, message:null}
  }
}
attrItem_table.Tel.createActions = (item) => {
  if (item.divided) {
    return {
      oninput: (ev) => (state, _actions) => {
        const idx = branchNo(ev.currentTarget.name, '-')
        return {...state, value:replaceElement(state.value, idx, ev.currentTarget.value)}
      }, 
      onblur: (ev) => ({value, _message}, _actions) => {
        const idx = branchNo(ev.currentTarget.name, '-')
        if (idx == 2) {
          if (!item.required && value.every(emptyString)) {
            // thru
          } else if (value.some(emptyString)) {
            return {value, message:MSG_REQUIRED}
          } else if (! value.join('').match(/^[0-9]+$/)) {
            return {value, message:MSG_INVALID}
          }
        }
        return {value, message:null}
      }
    }
  } else {
    return {
      oninput: (ev) => (state, _actions) => {
        return {...state, value:ev.currentTarget.value}
      }, 
      onblur: (ev) => ({value, _message}, _actions) => {
        if (!item.required && value == "") {
          // thru
        } else if (value == "") {
          return {value, message:MSG_REQUIRED}
        } else if (! value.match(/^[0-9-]+$/)) {
          return {value, message:MSG_INVALID}
        }
        return {value, message:null}
      }
    }
  }
}

// {type, id, name, required, note, autoFill}
attrItem_table.Address = {}
attrItem_table.Address.view = (item, state, actions) => {
  const id = `wq-attr-address-${item.id}`
  const name = `address-${item.id}`
  return (
    <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass={`wq-belongs-attr wq-for-address`} key={id}>
      <InputGroup gutter="mini" xclass="wq-belongs-attr wq-belongs-address">
        <span>{_Tv('Zip')}</span>
        <TextInput type="tel" name={`${name}-0`} size="small" value={state.value[0]} oninput={actions.oninput} onblur={actions.onblur} placeholder={_T('000-0000')} invalid={!!state.message} xclass={`wq-belongs-attr wq-belongs-address wq-for-zip wq_attr-${item.id}`} />
      </InputGroup>
      <InputGroup gutter="mini" xclass="wq-belongs-attr wq-belongs-address">
        <TextInput type="text" name={`${name}-1`} size="small" value={state.value[1]} oninput={actions.oninput} onblur={actions.onblur} placeholder={_T('Tokyo')} invalid={!!state.message} xclass={`wq-belongs-attr wq-belongs-address wq-for-pref wq_attr-${item.id}`} />
        <TextInput type="text" name={`${name}-2`} size="small" value={state.value[2]} oninput={actions.oninput} onblur={actions.onblur} placeholder={_T('Chiyoda-ku')} invalid={!!state.message} xclass={`wq-belongs-attr wq-belongs-address wq-for-city wq_attr-${item.id}`} />
      </InputGroup>
      <TextInput type="text" name={`${name}-3`} size="full" value={state.value[3]} oninput={actions.oninput} onblur={actions.onblur} placeholder={_T('1-1-1, Chiyoda')} invalid={!!state.message} xclass={`wq-belongs-attr wq-belongs-address wq-for-street wq_attr-${item.id}`} />
      <TextInput type="text" name={`${name}-4`} size="full" value={state.value[4]} oninput={actions.oninput} onblur={actions.onblur} placeholder={_T('Chiyoda mansion 8F')} invalid={!!state.message} xclass={`wq-belongs-attr wq-belongs-address wq-for-room wq_attr-${item.id}`} />
    </Control>
  )
}
attrItem_table.Address.initialState = (_item) => ({message:null, value:["", "", "", "", ""]})
attrItem_table.Address.compile = (_item, state) => {
  if (state.value.every(emptyString)) {
    return ""
  } else {
    return `${state.value[0]} ${state.value[1]}${state.value[2]}${state.value[3]} ${state.value[4]}`
  }
}
attrItem_table.Address.validate = (item, {value, message}) => {
  if (!item.required && value.every(emptyString)) {
    // thru
  } else if (value[0] == "" || value[1] == "" || value[2] == "" || value[3] == "") {
    return {value, message:MSG_REQUIRED}
  } else if (! value[0].match(new RegExp(_T('^[0-9]{3}-?[0-9]{4}$')))) {
    return {value, message:MSG_INVALID}
  }
  return {value, message:null}
}
attrItem_table.Address.createActions = (item) => {
  return {
    oninput: (ev) => (state, actions) => {
      const idx = branchNo(ev.currentTarget.name, '-')
      const curval = ev.currentTarget.value
      if (item.autoFill == 'yubinbango' && idx == 0 && curval.match(new RegExp(_T('^[0-9]{3}-?[0-9]{4}$')))) {
        window.requestAnimationFrame(() => complementAddress(curval, actions.onfill))
      }
      return {...state, value:replaceElement(state.value, idx, curval)}
    }, 
    onblur: (ev) => ({value, message}, actions) => {
      const idx = branchNo(ev.currentTarget.name, '-')
      if (idx == 4) {
        if (!item.required && value.every(emptyString)) {
          // thru
        } else if (value[0] == "" || value[1] == "" || value[2] == "" || value[3] == "") {
          return {value, message:MSG_REQUIRED}
        } else if (! value[0].match(new RegExp(_T('^[0-9]{3}-?[0-9]{4}$')))) {
          return {value, message:MSG_INVALID}
        }
      }
      return {value, message:null}
    }, 
    onfill: (fs) => ({value, message}, actions) => {
      value = [value[0], fs.region, fs.locality, fs.street, value[4]]
      return {value, message}
    }
  }
}

// {type, id, name, required, note}
attrItem_table.Checkbox = {}
attrItem_table.Checkbox.view = (item, state, actions) => {
  const id = `wq-attr-checkbox-${item.id}`
  const name = `checkbox-${item.id}`
  return (
    <Control label="" required={false} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-checkbox" key={id}>
      <InputGroup xclass="wq-belongs-attr wq-belongs-checkbox">
        <Checkbox name={name} value="true" checked={state.checked} invalid={!!state.message} onchange={actions.onchange} xclass={`wq-belongs-attr wq-belongs-checkbox`} inputXclass={`wq_attr-${item.id}`}>{item.name}</Checkbox>
      </InputGroup>
    </Control>
  )
}
attrItem_table.Checkbox.initialState = (item) => ({checked:!!item.initialValue, message:null})
attrItem_table.Checkbox.compile = (_item, state) => (state.checked ? _T('Checked') : '')
attrItem_table.Checkbox.validate = (item, state) => {
  if (item.required && !state.checked) {
    return {checked:state.checked, message:MSG_TOCHECK}
  }
  return (state.message == null) ? state : {checked:state.checked, message:null}
}
attrItem_table.Checkbox.createActions = (item) => {
  return {
    onchange: (ev) => ({checked, message}, actions) => {
      if (ev.currentTarget.checked) {
        return {checked:true, message:null}
      } else if (item.required) {
        return {checked:false, message:MSG_TOCHECK}
      } else {
        return {checked:false, message:null}
      }
    }
  }
}

// {type, id, name, required, note, options}
attrItem_table.Radio = {}
attrItem_table.Radio.view = (item, state, actions) => {
  const id = `wq-attr-radio-${item.id}`
  const name = `radio-${item.id}`
  return (
    <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-radio" key={id}>
      <InputGroup gutter="mini" xclass="wq-belongs-attr wq-belongs-radio">
        {item.options.map((opt, i) => {
          return (
            <RadioButton name={name} value={opt} checked={state.value == opt} invalid={!!state.message} onchange={actions.onchange} index={i} xclass={`wq-belongs-attr wq-belongs-radio`} inputXclass={`wq_attr-${item.id}`}>{opt}</RadioButton>
          )
        })}
      </InputGroup>
    </Control>
  )
}
attrItem_table.Radio.initialState = (item) => {
  const vs = item.options.filter(o => o == item.initialValue)
  return {value:vs.length > 0 ? vs[0] : null, message:null}
}
attrItem_table.Radio.compile = (_item, state) => state.value
attrItem_table.Radio.validate = (item, state) => {
  if (!item.required && state.value == null) {
    // thru
  } else if (state.value == null) {
    return {value:state.value, message:MSG_TOSELECT}
  } else if (indexOf(state.value, item.options) == -1) {
    return {value:state.value, message:MSG_INVALID}
  }
  return {value:state.value, message:null}
}
attrItem_table.Radio.createActions = (item) => {
  return {
    onchange: (ev) => ({value, message}, actions) => {
      if (ev.currentTarget.checked) {
        const value = ev.currentTarget.value || null
        return {value, message:null}
      }
    }
  }
}

// {type, id, name, required, note, options}
attrItem_table.Dropdown = {}
attrItem_table.Dropdown.view = (item, state, actions) => {
  const id = `wq-attr-dropdown-${item.id}`
  const name = `dropdown-${item.id}`
  const placeholder = _T('Please select')
  return (
    <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-dropdown" key={id}>
      <Select name={name} options={item.options} value={state.value} invalid={!!state.message} onchange={actions.onchange} xclass={`wq-belongs-attr wq-belongs-select`} inputXclass={`wq_attr-${item.id}`} placeholder={placeholder} />
    </Control>
  )
}
attrItem_table.Dropdown.initialState = attrItem_table.Radio.initialState
attrItem_table.Dropdown.compile = attrItem_table.Radio.compile
attrItem_table.Dropdown.validate = attrItem_table.Radio.validate
attrItem_table.Dropdown.createActions = (item) => {
  return {
    onchange: (ev) => ({_value, message}, actions) => {
      const value = ev.currentTarget.value || null
      return {value, message: (!value && item.required) ? MSG_TOSELECT : null}
    }
  }
}

// {type, id, name, required, note, options, initialValue}
attrItem_table.MultiCheckbox = {}
attrItem_table.MultiCheckbox.view = (item, state, actions) => {
  const id = `wq-attr-multicheckbox-${item.id}`
  const name = `multicheckbox-${item.id}`
  return (
    <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass="wq-belongs-attr wq-for-multicheckbox" key={id}>
      <InputGroup gutter="mini" xclass="wq-belongs-attr wq-belongs-multicheckbox">
        {item.options.map((opt, i) => {
          return (
            <Checkbox id={`${id}-${i}`} name={name} value={opt} checked={indexOf(opt, state.value) != -1} invalid={!!state.message} onchange={actions.onchange} xclass={`wq-belongs-attr wq-belongs-multicheckbox`} inputXclass={`wq_attr-${item.id}`}>{opt}</Checkbox>
          )
        })}
      </InputGroup>
    </Control>
  )
}
attrItem_table.MultiCheckbox.initialState = (item) => {
  return {value:item.initialValue, message:null}
}
attrItem_table.MultiCheckbox.compile = (_item, state) => state.value
attrItem_table.MultiCheckbox.validate = (item, state) => {
  if (!item.required && state.value.length == 0) {
    // thru
  } else if (state.value.length == 0) {
    return {value:state.value, message:MSG_TOSELECT}
  }
  return {value:state.value, message:null}
}
attrItem_table.MultiCheckbox.createActions = (item) => {
  return {
    onchange: (ev) => ({value, message}, actions) => {
      const v = ev.currentTarget.value
      return {
        value: ev.currentTarget.checked ? [...value, v] : value.filter(v0 => v0 != v), 
        message: null
      }
    }
  }
}

// {type, id, name, required, note, size, placeholder, multiline}
attrItem_table.Text = {}
attrItem_table.Text.view = (item, state, actions) => {
  const id = `wq-attr-text-${item.id}`
  const name = `text-${item.id}`
  if (item.multiline) {
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass={`wq-belongs-attr wq-for-text wq-has-textarea`} key={id}>
        <TextArea size={item.size} name={name} placeholder={item.placeholder} value={state.value} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-text wq_attr-${item.id}`} /> 
      </Control>
    )
  } else {
    return (
      <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass={`wq-belongs-attr wq-for-text`}>
        <TextInput type="text" size={item.size} name={name} placeholder={item.placeholder} value={state.value} invalid={!!state.message} oninput={actions.oninput} onblur={actions.onblur} xclass={`wq-belongs-attr wq-belongs-text wq_attr-${item.id}`} /> 
      </Control>
    )
  }
}
attrItem_table.Text.initialState = (_item) => ({value:"", message:null})
attrItem_table.Text.compile = (_item, state) => state.value
attrItem_table.Text.validate = (item, state) => {
  if (item.required && state.value == "") {
    return {value:state.value, message:MSG_REQUIRED}
  }
  return (state.message == null) ? state : {value:state.value, message:null}
}
attrItem_table.Text.createActions = (item) => {
  return {
    oninput: (ev) => (state, _actions) => {
      return {...state, value:ev.currentTarget.value}
    }, 
    onblur: (ev) => (state, _actions) => {
      if (item.required && state.value == "") {
        return {value:state.value, message:MSG_REQUIRED}
      } else {
        return {value:state.value, message:null}
      }
    }
  }
}

// {id, type, action, siteKey}
attrItem_table.reCAPTCHA3 = {}
attrItem_table.reCAPTCHA3.view = (item, state, actions) => null
attrItem_table.reCAPTCHA3.initialState = item => {
  if (item.siteKey) {
    // サイトキー・シークレットキーが入力されている場合のみ動作する。
    window.setTimeout(() => {
      // Gutenberg executes this code *before* document.body initialized.
      // So defer its execution.
      var e = document.createElement("script");
      e.setAttribute('src', `https://www.google.com/recaptcha/api.js?render=${item.siteKey}`)
      document.body.appendChild(e)
    }, 1000)
  }
  
  return {value:"", message:null}
}
attrItem_table.reCAPTCHA3.compile = (item, _state) => {
  if (!item.siteKey) return ""
  return (postfix) => {
    grecaptcha.execute(item.siteKey, {action: item.action}).then(token => {
      postfix(token)
    })
  }
}
attrItem_table.reCAPTCHA3.validate = (item, state) => {
  return state
}
attrItem_table.reCAPTCHA3.createActions = (item) => {{}}

// item = {id, type, multiple, extensions, maxsize}
// state = {value, message};  value = {key, name, url}[]
attrItem_table.File = {}
attrItem_table.File.view = (item, state, actions) => {
  const id = `wq-attr-file-${item.id}`
  const name = `file-${item.id}`
  return (
    <Control label={item.name} required={item.required} message={_Tv(state.message)} note={item.note} requiredText={_Tv(item.required ? 'required' : 'optional')} id={id} xclass={`wq-belongs-attr wq-for-file`}>
      <InputGroup gutter="mini" xclass="wq-belongs-attr wq-belongs-file">
        {(item.multiple || state.value.length == 0) ? (
          <FileInput key="file-input" name={name} onchange={actions.onChange} extensions={item.extensions} multiple={item.multiple} inputXclass={`wq_attr-${item.id}`} xclass={state.dragover ? 'wq-is-dragging' : ''} invalid={!!state.message} ondragover={actions.onDragOver} ondragleave={actions.onDragLeave} ondrop={actions.onDrop}>{_T('Drop files here or click')}</FileInput>
        ) : null}
        {state.value.map((file, i) => {
          return (
            <File index={i} key={file.key} url={file.url} name={file.name} loading={!file.url} ondelete={actions.onDelete} />
          )
        })}
      </InputGroup>
    </Control>
  )
}
attrItem_table.File.initialState = (item) => {
  return {value:[], message:null, dragover:false}
}
attrItem_table.File.compile = (item, state) => {
  return state.value.map(({key:_key, ...rv}) => rv)
}
attrItem_table.File.validate = (item, state) => {
  if (item.required && state.value.length == 0) {
    return {value:state.value, message:MSG_REQUIRED}
  }
  for (let i = 0; i < state.value.length; i++) {
    if (! state.value[i].url) return {...state, message:MSG_UPLOADING}
  }
  return (state.message == null) ? state : {...state, message:null}
}
attrItem_table.File.createActions = (item) => {
  return {
    onDelete: (ev) => (state, actions) => {
      const index = ev.currentTarget.dataset.index
      if (window.confirm(_T('Removing the file. Are you sure?'))) {
        const value = [...state.value]
        value.splice(index, 1)
        return {...state, value}
      }
    }, 
    onChange: (ev) => (state, actions) => {
      const uploadId = Math.floor((new Date()).getTime() / 1000)
      const files = ev.currentTarget.files
      const results = window.aformsUpload(form.id, item, uploadId, files, actions.onChangeK)
      const value = [...state.value]
      for (let i = 0; i < files.length; i++) {
        if (! results[i]) continue
        value.push({
          key: uploadId + '-' + i, 
          name: files[i].name, 
          url: null
        })
      }
      return {...state, value}
    }, 
    onChangeK: ({uploadId, urls, message:serverMsg}) => (state, actions) => {
      if (serverMsg) {
        window.alert(serverMsg)
      }
      const value = [...state.value]
      urls.forEach((url, i) => {
        const key = uploadId + '-' + i
        const pos = findIndexByProp('key', key, value)
        if (pos == -1) return
        if (url) {
          value[pos] = {...value[pos], url}
        } else {
          value.splice(pos, 1)
        }
      })
      const message = (value.length && state.message) ? null : state.message
      return {...state, value, message}
    }, 
    onDragOver: (ev) => (state, actions) => {
      ev.preventDefault()
      return {...state, dragover:true}
    }, 
    onDragLeave: (ev) => (state, actions) => {
      return {...state, dragover:false}
    }, 
    onDrop: (ev) => (state, actions) => {
      ev.preventDefault()
      const uploadId = Math.floor((new Date()).getTime() / 1000)
      const files = ev.dataTransfer.files
      const results = window.aformsUpload(form.id, item, uploadId, files, actions.onChangeK)
      const value = [...state.value]
      for (let i = 0; i < files.length; i++) {
        if (! results[i]) continue
        value.push({
          key: uploadId + '-' + i, 
          name: files[i].name, 
          url: null
        })
      }
      return {...state, value, dragover:false}
    }
  }
}


const assembleAttrItems = (items) => {
  return items.reduce(({state, actions}, item) => {
    const s = attrItem_table[item.type].initialState(item)
    const a = attrItem_table[item.type].createActions(item)
    return {actions:{...actions, [item.id]:a}, state:{...state, [item.id]:s}}
  }, {actions:{}, state:{}})
}

const viewAttrItems = (state, actions) => {
  return (
    <div class="wq-Attributes">
      {form.attrItems.map(item => {
        return attrItem_table[item.type].view(item, state[item.id], actions[item.id])
      })}
    </div>
  )
}
const viewAttrItemsToConfirm = (state, actions) => {
  return (
    <div class="wq-Attributes wq-is-confirming">
      {form.attrItems.map(item => {
        if (item.type == 'reCAPTCHA3') return null
        const id = `wq-attr-${item.type.toLowerCase()}-${item.id}`
        const value = attrItem_table[item.type].compile(item, state[item.id])
        return (
          <Control label={item.name} required={item.required} id={id} key={id}>
            {item.type == 'File' ? (
              <InputGroup gutter="mini" xclass="wq-belongs-attr wq-belongs-file">
                {value.map((file, i) => {
                  return (
                    <File index={i} key={`file-${i}`} url={file.url} name={file.name} loading={!file.url} ondelete={null} readonly />
                  )
                })}
              </InputGroup>
            ) : (
              <Echo value={value} xclass={`wq-belongs-attr wq_attr-${item.id}`} glue={_T(', ')}></Echo>
            )}
          </Control>
        )
      })}
    </div>
  )
}

const validateAttrData = (state) => {
  return form.attrItems.reduce((state, item) => {
    const s = attrItem_table[item.type].validate(item, state[item.id])
    if (s === state[item.id]) return state
    return {...state, [item.id]:s}
  }, state)
}


/*
 * ===============================================================
 * domain
 */

// Catalog = string{}
// SelectOption = {id:number, image:?string, name:string, note:?string, normalPrice:?number, price:number, labels:any{}, depends:any{}}
// Select = {type:'Select', id:number, image:?string, name:string, note:?string, multiple:bool, options:SelectOption[]}
// Hidden = {type:'Hidden', id:number, image:?string, category:?string, name:string, price:number, depends:any{}}
// Item = Select | Hidden
// Form = {id:number, items:Item[]}
// SelectedOptions = any{}
// Input = SelectedOptions
// State = {inputs:Input{}, labels:any{}}
// Detail = {category:?string, name:string, unitPrice:number, quantity:number}


const createDetail = (key, category, name, quantity, normalUnitPrice, unitPrice, taxRate) => {
  return {key, category, name, quantity, normalUnitPrice, unitPrice, taxRate}
}

// inputs -> [inputs, labels, details, total]
const process = (inputs) => {
  const {env:_env, effectiveTotal:_effectiveTotal, ...rv} = form.detailItems.reduce((cur, item) => {
    return processTable[item.type](cur, item)
  }, {inputs, env:{}, labels:{}, details:[], total:0, normalTotal:0, effectiveTotal:0})

  if (rule.taxIncluded) return rv

  const subtotals = rv.details.reduce((subtotals, detail) => {
    const key = detail.taxRate === null ? "" : ""+detail.taxRate
    const subtotal = (
      subtotals.hasOwnProperty(key) ? subtotals[key] : 0
    ) + normalizePrice(rule, detail.unitPrice * detail.quantity)
    return {...subtotals, [key]:subtotal}
  }, {})

  const taxes = reduceHash((cur, key, subtotal) => {
    const taxRate = key === "" ? rule.taxRate : key
    const tax = normalizePrice(rule, subtotal * taxRate * 0.01)
    return {...cur, [key]:tax}
  }, {}, subtotals)

  return {...rv, subtotals, taxes}
}
const processTable = {
  Selector: (cur, item) => {
    if (! cur.inputs.hasOwnProperty(item.id)) {
      return cur
    }
    return item.options.reduce((cur, option) => {
      // We check because there can be a case where the option was cleared and the item had no selection.
      if (! cur.inputs.hasOwnProperty(item.id)) {
        return cur
      }
      const selectedOptions = cur.inputs[item.id]
      if (! selectedOptions.hasOwnProperty(option.id)) {
        return cur
      }
      if (! satisfied(cur.labels, option.depends)) {
        // The dependency not met. Then clear selection.
        const inputs = {...cur.inputs, [item.id]:exclude(selectedOptions, option.id)}
        return {...cur, inputs}
      }
      const quantity0 = findQuantity(cur.inputs, item.quantity, cur.labels, cur.env)
      const quantity = option.type == 'Option' ? quantity0
        : quantity0 * selectedOptions[option.id]
      if (isNaN(quantity)) {
        return cur
      }
      if (typeof option.price != "number") {
        const labels = extend(cur.labels, option.labels)
        return {...cur, labels}
      }
      const detail = createDetail(`Option-${item.id}-${option.id}`, item.name, option.name, quantity, option.normalPrice, option.price, option.taxRate)
      const details = [...cur.details, detail]
      const labels = extend(cur.labels, option.labels)
      const price = normalizePrice(rule, detail.unitPrice * detail.quantity)
      const total = cur.total + price
      const normalTotal = cur.normalTotal + normalizePrice(rule, (typeof detail.normalUnitPrice == 'number' ? detail.normalUnitPrice : detail.unitPrice) * detail.quantity)
      const effectiveTotal = cur.effectiveTotal + price
      return {...cur, details, labels, total, normalTotal, effectiveTotal}
    }, cur)
  }, 
  Auto: (cur, item) => {
    if (! satisfied(cur.labels, item.depends)) {
      return cur
    }
    const quantity = findQuantity(cur.inputs, item.quantity, cur.labels, cur.env)
    if (isNaN(quantity)) {
      return cur
    }
    const unitPrice = evalExpr(item.priceAst, item.priceVars, cur.effectiveTotal, cur.inputs, cur.labels, cur.env, item.price)
    if (isNaN(unitPrice)) {
      return cur
    }
    const detail = createDetail(`Auto-${item.id}`, item.category, item.name, quantity, item.normalPrice, unitPrice, item.taxRate)
    const details = [...cur.details, detail]
    const price = normalizePrice(rule, detail.unitPrice * detail.quantity)
    const total = cur.total + price
    const normalTotal = cur.normalTotal + normalizePrice(rule, (typeof detail.normalUnitPrice == 'number' ? detail.normalUnitPrice : detail.unitPrice) * detail.quantity)
    const effectiveTotal = cur.effectiveTotal + price
    return {...cur, details, total, normalTotal, effectiveTotal}
  }, 
  Adjustment: (cur, item) => {
    if (! satisfied(cur.labels, item.depends)) {
      return cur
    }
    const quantity = findQuantity(cur.inputs, item.quantity, cur.labels, cur.env)
    if (isNaN(quantity)) {
      return cur
    }
    const unitPrice = evalExpr(item.priceAst, item.priceVars, cur.effectiveTotal, cur.inputs, cur.labels, cur.env, item.price)
    if (isNaN(unitPrice)) {
      return cur
    }
    const detail = createDetail(`Adjustment-${item.id}`, item.category, item.name, quantity, item.normalPrice, unitPrice, item.taxRate)
    const details = [...cur.details, detail]
    const price = normalizePrice(rule, detail.unitPrice * detail.quantity)
    const total = cur.total + price
    const normalTotal = cur.normalTotal + normalizePrice(rule, (typeof detail.normalUnitPrice == 'number' ? detail.normalUnitPrice : detail.unitPrice) * detail.quantity)
    return {...cur, details, total, normalTotal}
  }, 
  PriceWatcher: (cur, item) => {
    if (! compare2(cur.effectiveTotal, item.lower, item.lowerIncluded, item.higher, item.higherIncluded)) {
      return cur
    }
    const labels = extend(cur.labels, item.labels)
    return {...cur, labels}
  }, 
  QuantityWatcher: (cur, item) => {
    if (item.target == -1) return cur
    const value = findQuantity(cur.inputs, item.target, cur.labels, cur.env)
    if (isNaN(value)) return cur
    if (! compare2(value, item.lower, item.lowerIncluded, item.higher, item.higherIncluded)) return cur
    const labels = extend(cur.labels, item.labels)
    return {...cur, labels}
  }, 
  Quantity: (cur, item) => {
    if (! cur.inputs.hasOwnProperty(item.id)) {
      const inputs = {...cur.inputs, [item.id]:item.initial}
      return {...cur, inputs}
    }
    return cur
  }, 
  Slider: (cur, item) => {
    if (! cur.inputs.hasOwnProperty(item.id)) {
      const inputs = {...cur.inputs, [item.id]:item.initial}
      return {...cur, inputs}
    }
    return cur
  }, 
  AutoQuantity: (cur, item) => {
    const q = evalExpr(item.quantityAst, item.quantityVars, cur.effectiveTotal, cur.inputs, cur.labels, cur.env, item.quantity)
    if (isNaN(q)) {
      return cur
    }
    const env = {...cur.env, [item.id]:q}
    return {...cur, env}
  }, 
  Stop: (cur, item, attrs) => {
    return cur
  }
}


const validateDetailDataForItem = (detailData, item, labels) => {
  const msg = validate_table[item.type](detailData, item, labels)
  return msg
}
const validateDetailData = (detailData, labels) => {
  return form.detailItems.reduce((messages, item) => {
    const message = validate_table[item.type](detailData, item, labels)
    if (message) {
      if (item.type == 'Stop') {
        return {stopMessage:message, ...messages}
      } else {
        return {...messages, [item.id]:message}
      }
    } else {
      return messages
    }
  }, {})
}
const validate_table = {
  Selector: (detailData, item, labels) => {
    if (detailData.hasOwnProperty(item.id)) return null
    if (item.multiple) return null
    if (item.options.every(option => !satisfied(labels, option.depends))) return null
    return MSG_TOSELECT
  }, 
  Auto: (detailData, item, labels) => null, 
  Adjustment: (detailData, item, labels) => null, 
  PriceWatcher: (detailData, item, labels) => null, 
  QuantityWatcher: (detailData, item, labels) => null, 
  Quantity: (detailData, item, labels) => {
    if (!satisfied(labels, item.depends)) return null
    if (! detailData.hasOwnProperty(item.id) || detailData[item.id] === "") return MSG_REQUIRED
    const value = item.allowFraction ? parseFloat(detailData[item.id]) : parseInt(detailData[item.id], 10)
    if (isNaN(value) || value+"" != detailData[item.id]) return MSG_INVALID
    if (item.minimum !== null && item.minimum > value) return MSG_TOOSMALL
    if (item.maximum !== null && item.maximum < value) return MSG_TOOLARGE
    return null
  }, 
  Slider: (detailData, item, labels) => {
    if (!satisfied(labels, item.depends)) return null
    if (! detailData.hasOwnProperty(item.id) || detailData[item.id] === "") return MSG_REQUIRED
    const value = parseFloat(detailData[item.id])
    if (isNaN(value) || value+"" != detailData[item.id]) return MSG_INVALID
    return null
  }, 
  AutoQuantity: (detailData, item, labels) => null, 
  Stop: (detailData, item, labels) => {
    //return null
    if (!satisfied(labels, item.depends)) return null
    return item.message
  }
}

const detailActions = {
  selectChange: (ev) => ({data, messages, ...others}, _actions) => {
    const [sid, oid] = ev.target.dataset['path'].split('/')
    if (! data.hasOwnProperty(sid)) data[sid] = {}
    const selector = findByProp("id", sid, form.detailItems)
    const option = findByProp("id", oid, selector.options)
    if (selector.multiple) {
      if (option.type == 'Option') {
        if (ev.target.checked) {
          data = {...data, [sid]:{...data[sid], [oid]:true}}
        } else {
          const selectedOptions = data[sid]
          data = {...data, [sid]:exclude(selectedOptions, oid)}
        }
      } else {
        if (ev.target.value != "") {
          data = {...data, [sid]:{...data[sid], [oid]:ev.target.value}}
        } else {
          // deselect
          const selectedOptions = data[sid]
          data = {...data, [sid]:exclude(selectedOptions, oid)}
        }
      }
      // messagesは変更しない。multiple selectorではmessageは発生しない。
    } else {
      if (option.type == 'Option') {
        data = {...data, [sid]:{[oid]:true}}
      } else {
        data = {...data, [sid]:{[oid]:ev.target.value}}
      }
      messages = exclude(messages, selector.id)
    }
    const {inputs, ...rest} = process(data)
    return {...others, ...rest, messages, data:inputs}
  }, 
  textInput: (ev) => ({data, ...rest}, _actions) => {
    const id = branchNo(ev.currentTarget.id, '-')
    data = {...data, [id]:ev.currentTarget.value}
    if (ev.currentTarget.type == 'number' && ev.currentTarget != window.activeElement) {
      // for firfox
      ev.currentTarget.focus()
    }
    return {...rest, data}
  }, 
  textBlur: (ev) => ({data, messages, ...others}, _actions) => {
    const id = branchNo(ev.currentTarget.id, '-')
    const item = findByProp("id", id, form.detailItems)
    if (data[id] === "") {
      messages = {...messages, [id]:MSG_REQUIRED}
      return {...rest, data, messages}
    }
    const value = item.allowFraction ? parseFloat(data[id]) : parseInt(data[id], 10)
    if (isNaN(value) || value+"" != data[id]) {
      messages = {...messages, [id]:MSG_INVALID}
      return {...rest, data, messages}
    }
    if (item.minimum !== null && item.minimum > value) {
      messages = {...messages, [id]:MSG_TOOSMALL}
      return {...rest, data, messages}
    }
    if (item.maximum !== null && item.maximum < value) {
      messages = {...messages, [id]:MSG_TOOLARGE}
      return {...rest, data, messages}
    }
    data = {...data, [id]:value}
    messages = exclude(messages, id)
    const {inputs, ...rest} = process(data)
    return {...others, ...rest, data:inputs, messages}
  }, 
  rangeBlur: (ev) => ({data, ...others}, _actions) => {
    const id = branchNo(ev.currentTarget.id, '-')
    const item = findByProp("id", id, form.detailItems)
    data = {...data, [id]:ev.currentTarget.value}
    const {inputs, ...rest} = process(data)
    return {...others, ...rest, data:inputs}
  }
}


const createDetailState = () => {
  const {inputs:data, ...rest} = process({})
  return {...rest, data, messages:{}}
}

const onback = (ev) => (state, actions) => {
  window.setTimeout(() => {
    scrollTo('root')
  }, 100)
  return {...state, viewMode:form.navigator}
}

const onaction = (ev) => (state, actions) => {
  // validate
  const {stopMessage, ...detailMessages} = validateDetailData(state.details.data, state.details.labels)
  const attrs = validateAttrData(state.attrs)
  const attrMessages = reduceHash((cur, cid, stt) => {
    return (stt.message == null) ? cur : {...cur, [cid]:stt.message}
  }, {}, attrs)
  if (stopMessage || Object.keys(detailMessages).length || Object.keys(attrMessages).length) {
    // validation failed
    window.requestAnimationFrame(() => {
      if (Object.keys(detailMessages).length) focusErrorInput('wq_detail-', detailMessages)
      else if (stopMessage) window.alert(stopMessage)
      else if (Object.keys(attrMessages).length) focusErrorInput('wq_attr-', attrMessages)
    }, 100)
    const details = {...state.details, messages:detailMessages}
    return {...state, details, attrs}
  }

  const action = ev.currentTarget.dataset['action']
  if (action == 'confirm') {
    // show confirm view
    window.setTimeout(() => {
      scrollTo('root')
    }, 100)
    return {...state, viewMode:'confirm'}
  }

  const extId = ev.currentTarget.dataset['id']

  const kontinue = (attrs) => {
    if (mode == 'preview') {
      window.requestAnimationFrame(() => {window.alert(_T('Processing stopped due to preview mode.'))});
      return;
    }

    const data = {
      formId: form.id, 
      details: state.details.data, 
      attrs
    }
    if (action == 'custom') {
      submitCustom(data, actions.onactionK, extId)
    } else {
      submit(data, actions.onactionK)
    }
  }

  window.requestAnimationFrame(() => {
    let waitCount = 0
    let compiledAttrs = {}
    form.attrItems.forEach(item => {
      const val = attrItem_table[item.type].compile(item, attrs[item.id])
      if (typeof val == 'function') {
        const postfix = (dataValue) => {
          waitCount--
          compiledAttrs[item.id] = dataValue
          if (waitCount == 0) kontinue(compiledAttrs)
        }
        waitCount++
        val(postfix)
      } else {
        compiledAttrs[item.id] = val
      }
    })
    if (waitCount == 0) kontinue(compiledAttrs)
  })
  
  return {...state, loading:true}
}

const onactionK = (resp) => (state, actions) => {
  const handleOption = (option, k) => {
    if (option) {
      if (option.action == 'open') {
        if (window.open(option.data)) {
          k(true)
        } else {
          const k2 = (res) => {window.setTimeout(() => k(res), 300)}
          window.aformsDialog(_T('Your document is ready.'), option.data, _T('Open'), k2, _T('Skip'))
        }
      } else {
        k(false)
      }
    } else {
      k(false)
    }
  }
  window.requestAnimationFrame(() => {
    if (resp.action == 'show') {
      handleOption(resp.option, (_x) => {
        window.aformsDialog(resp.data, null, null, (_x) => {})
        //window.alert(resp.data)
      })
    } else if (resp.action == 'open') {
      handleOption(resp.option, (_x) => {window.location.href = resp.data})
    } else {  // action == none
      // do nothing
      handleOption(resp.option, (_x) => {})
    }
  })
  if (resp.clearLoading) {
    return {...state, loading:false}
  } else {
    // we don't set state.loading to `false`.
  }
}

const onHideMonitor = (ev) => (state, actions) => {
  return {...state, spMonitorShown:false}
}
const onShowMonitor = (ev) => (state, actions) => {
  return {...state, spMonitorShown:true}
}

const findNextIndex = (current, labels) => {
  const len = form.detailItems.length
  for (let i = 0; i < len; i++) {
    if (i <= current) continue;
    const item = form.detailItems[i]
    if (item.type == "Selector") {
      if (item.options.some(option => satisfied(labels, option.depends))) {
        return i
      }
      // thru
    } else if (item.type == "Quantity" || item.type == "Slider") {
      if (satisfied(labels, item.depends)) {
        return i
      }
      // thru
    }
  }
  return form.detailItems.length
}

const findPrevIndex = (current, labels) => {
  if (current <= 0) return -1
  const indice = form.detailItems.reduce((cur, item, i) => {
    if (current <= i) return cur
    if (item.type == "Selector") {
      if (item.options.some(option => satisfied(labels, option.depends))) {
        cur.push(i)
      }
    } else if (item.type == "Quantity" || item.type == "Slider") {
      if (satisfied(labels, item.depends)) {
        cur.push(i)
      }
    }
    return cur
  }, [])
  return (indice.length > 0) ? indice.pop() : -1
}

const onWizardOpen = (ev) => (state, actions) => {
  const wIndex = findNextIndex(-1, state.details.labels)
  return {...state, wIndex, wIndex2:wIndex, wizardOpen:true, wFlipped:false}
}
const onWizardClose = (ev) => (state, actions) => {
  return {...state, wIndex:-1, wIndex2:-1, wizardOpen:false}
}
const onWizardNext = (ev) => (state, actions) => {
  const item = form.detailItems[state.wIndex]
  const msg = validateDetailDataForItem(state.details.data, item, state.details.labels)
  if (msg) {
    const messages = {...state.details.messages, [item.id]:msg}
    const details = {...state.details, messages}
    return {...state, details}
  }
  const wIndex = findNextIndex(state.wIndex, state.details.labels)
  if (wIndex == form.detailItems.length) {
    window.setTimeout(actions.onWizardClose, 800)
    window.setTimeout(() => {
      scrollTo('wq-monitor')
    }, 800)
  } else {
    window.setTimeout(() => actions.onWizardNextK(wIndex), 400)
  }
  return {...state, wIndex, wFlipped:false}
}
const onWizardNextK = (wIndex2) => (state, actions) => {
  return {...state, wIndex2}
}
const onWizardPrev = (ev) => (state, actions) => {
  const wIndex = findPrevIndex(state.wIndex, state.details.labels)
  window.setTimeout(() => actions.onWizardPrevK(wIndex), 400)
  return {...state, wIndex, wFlipped:true}
}
const onWizardPrevK = (wIndex2) => (state, actions) => {
  return {...state, wIndex2}
}
const calcMonitorPos = (sidebar) => {
  const container = document.getElementById('root').children[0]
  const target = document.getElementById('wq-monitor')
  const crect = container.getBoundingClientRect()
  const srect = sidebar.getBoundingClientRect()
  const vtop = crect.top
  const vbot = crect.bottom
  const ch = target.getBoundingClientRect().height
  if (vtop > sidebarOffset) {
    // childをcontainerの上部にくっつける
    return {v:'top', left:srect.left - crect.left, width:srect.width}
  } else if (vbot < ch) {
    // childをcontainerの下部にくっつける
    return {v:'bottom', left:srect.left - crect.left, width:srect.width}
  } else {
    // childを画面にくっつける
    return {v:'screen', left:srect.left, width:srect.width}
  }
}
const onscroll = (ev) => (state, actions) => {
  if (state.viewMode == 'confirm') return null
  const sidebar = document.querySelector(wqData.sidebarSelector)
  if (! sidebar) return null
  return {...state, monitorPos:calcMonitorPos(sidebar)}
}
const onresize = (ev) => (state, actions) => {
  if (state.viewMode == 'confirm') return null
  const sidebar = document.querySelector(wqData.sidebarSelector)
  if (! sidebar) return null
  return {...state, monitorPos:calcMonitorPos(sidebar)}
}

/*
 * ===============================================================
 * App
 */

//var allActions = null;
//var form = null;

const NavBar = ({state, max, current, actions, navigator}) => {
  const percentage = 100 * Math.min(max, current) / max
  return (
    <div class={`wq-NavBar ${state.viewMode == 'confirm' ? 'wq-is-confirming' : ''} ${state.spMonitorShown ? 'wq-is-monitor-shown' : ''} wq-belongs-${navigator}`} key="navbar">
      <div class={`wq--progress ${max < current ? 'wq-is-finished' : ''}`}>
        <div class="wq--bar">
          <div class="wq--bar-content" style={{width:percentage+'%', height:percentage+'%'}} />
        </div>
        <div class="wq--min">1</div>
        <div class="wq--current">{current}</div>
        <div class="wq--max">{max}</div>
        <div class="wq--percentage">{Math.floor(percentage)}</div>
      </div>
      <div class="wq--summary">{pricePrefix + nf(state.details.total) + priceSuffix}</div>
      <div class="wq--commands">
        <Button type="normal" onclick={actions.onShowMonitor} xclass="wq-belongs-navbar wq-for-showmonitor">{_Tv('Show Monitor')}</Button>
      </div>
    </div>
  )
}

const view = (state, actions) => {
  const steps = form.detailItems.length
  const position = state.wIndex
  const actionSpecs = (state.viewMode == 'confirm') ? actionSpecMap.confirm : actionSpecMap.input
  const actionButtons = actionSpecs.map(spec => {
    return (
      <Button type={spec.buttonType} onclick={actions.onaction} disabled={state.loading} xclass={`wq-belongs-action wq-for-${spec.action}`} data-action={spec.action} data-id={spec.id}>{spec.label}</Button>
    )
  })
  return (
    <form class={`wq-Form ${(state.viewMode == 'confirm' ? 'wq-is-confirming' : '')}`} id={`form-${form.id}`} novalidate>
      <input type="text" id="wq-informer" name="to-disable-auto-submission" style="display:none;" />
      {state.viewMode == 'confirm' ? (
        <div class="wq--lead">
          <p class="wq--leadText">{_Tv('Please check your entry.')}</p>
          <Button type="normal" onclick={actions.onback} disabled={state.loading} xclass="wq-for-back">{_Tv('Back')}</Button>
        </div>
      ) : null}
      {steps > 0 && state.viewMode == 'horizontal' ? (
        <HNavigator data={state.details.data} onoptionchange={actions.details.selectChange} labels={state.details.labels} messages={state.details.messages} ontextinput={actions.details.textInput} ontextblur={actions.details.textBlur} onrangeblur={actions.details.rangeBlur}>
          <NavBar state={state} actions={actions} current={position} max={steps} navigator="hnavigator"></NavBar>
        </HNavigator>
      ) : null}
      {steps > 0 && state.viewMode == 'wizard' ? (
        <WNavigator data={state.details.data} onoptionchange={actions.details.selectChange} labels={state.details.labels} messages={state.details.messages} onWizardNext={actions.onWizardNext} onWizardPrev={actions.onWizardPrev} onWizardOpen={actions.onWizardOpen} onWizardClose={actions.onWizardClose} current={state.wIndex} current2={state.wIndex2} open={state.wizardOpen} flipped={state.wFlipped} ontextinput={actions.details.textInput} ontextblur={actions.details.textBlur} onrangeblur={actions.details.rangeBlur}>
          <NavBar state={state} actions={actions} current={position} max={steps} navigator="wnavigator"></NavBar>
        </WNavigator>
      ) : null}
      {steps > 0 ? (
        <Monitor detailsState={state.details} confirming={state.viewMode == 'confirm'} spShown={state.spMonitorShown} onHide={actions.onHideMonitor} monitorPos={state.monitorPos} />
      ) : null}
      {(form.attrItems.length > 0) ? (
        state.viewMode == 'confirm' ? viewAttrItemsToConfirm(state.attrs, actions.attrs) : viewAttrItems(state.attrs, actions.attrs)
      ) : null}
      {actionButtons.length > 0 ? (
        <Control label="" required={false} message={null} note={null} id="wq-action" xclass="wq-for-action">
          <InputGroup gutter="mini">
            {actionButtons}
          </InputGroup>
        </Control>
      ) : null}
    </form>
  )
}

// wqData = {form, controls, catalog, rule}
const form = wqData.form;
const catalog = wqData.catalog;
const rule = wqData.rule;
const behavior = wqData.behavior;
const mode = wqData.mode;
const submitUrl = wqData.submitUrl;
const customUrl = wqData.customUrl;
const [pricePrefix, priceSuffix] = catalog['$%s'].split('%s')
const actionSpecMap = wqData.actionSpecMap;

const init = () => {
  const {state:cState, actions:cActions} = assembleAttrItems(form.attrItems)
  const state = {
    details: createDetailState(), 
    attrs: cState, 
    viewMode: form.navigator,  // horizontal, confirm
    loading: false, 
    spMonitorShown: false, 
    wIndex: -1, 
    wIndex2: -1,  // スライドの遷移とアクションボタンの更新タイミングをずらすために導入。本当はwIndexだけでいいが、これが無いとスライドがうまく動かないケースがある。
    wizardOpen: false, 
    wFlipped: false, 
    monitorPos: {v:'top', left:5000, width:0}
  }
  const actions = {
    details: detailActions, 
    attrs: cActions, 
    onback, 
    onaction, 
    onactionK, 
    onHideMonitor, 
    onShowMonitor, 
    onWizardClose, 
    onWizardOpen, 
    onWizardNext, 
    onWizardNextK, 
    onWizardPrev, 
    onWizardPrevK, 
    onscroll, 
    onresize
  }
  return app(state, actions, view, document.getElementById('root'))
}
const allActions = init();

let sidebarOffset = 0;
if (wqData.sidebarSelector && form.navigator == 'horizontal') {
  window.setTimeout(() => {
    //console.log('binding', wqData.sidebarSelector)
    sidebarOffset = getComputedStyle(document.getElementById('wq-informer')).top.slice(0, -2)
    document.addEventListener('scroll', allActions.onscroll)
    window.addEventListener('resize', allActions.onresize)
    allActions.onscroll(null)
  }, 100)
}
