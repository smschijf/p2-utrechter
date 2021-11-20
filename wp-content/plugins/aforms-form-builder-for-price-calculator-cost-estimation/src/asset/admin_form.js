import { h, app } from 'hyperapp';
import Ajv from "ajv";
import Sortable from 'sortablejs';
import { createMessages, updateMessages, translate, deepCopy, Message, focusErrorInput, lmove, linsert, lremove, lreplace, findByProp, findIndexByProp, branchNo, tnOnCreate, tnOnRemove, joinSet, mapHash, scrollToTop, sprintf, makeParser, appendVars, Image } from './admin_common';

const submit = (form, k) => {
  const url = submitUrl.replace('placeholder', form.id)
  jQuery.ajax({
    type: "post", 
    url: url, 
    data: JSON.stringify(form), 
    contentType: 'application/json',
    success: function(response) {
      k(response)
    }, 
    dataType: 'json'
  });
}


const selectImage = (name, k) => {
  const modal = wp.media({
    title: _T('Select Image'), 
    library: {type:'image'}, 
    button: {text:_T('OK')}, 
    multiple: false
  });

  modal.on('select', (y) => {
    const image = modal.state().get('selection').first().toJSON();
    k({name, image})
  });
  modal.open()
}


const instantiateSortable = (
    {
      group, 
      handle, 
      onSortStart, 
      onSortEnd, 
      ...options 
    }
) => {
  var instance = null;
  var marker = null;
  const onStart = (ev) => {
    marker = ev.item.nextElementSibling
    onSortStart({
      id: ev.from.id, 
      index: ev.oldIndex
    })
  }
  const onEnd = (ev) => {
    setTimeout(function() {
      ev.from.insertBefore(ev.item, marker)
      marker = null
    }, 0)
    onSortEnd({
      fromId: ev.from.id, 
      fromIndex: ev.oldIndex, 
      toId: ev.to.id, 
      toIndex: ev.newIndex
    })
  }
  const effectiveOptions = {
    ...options, 
    group, 
    handle, 
    onStart, 
    onEnd, 
    ghostClass: "wq-is-ghost", 
    animation: 150
  }
  return {
    oncreate: (el) => {
      instance = Sortable.create(el, effectiveOptions)
      //tnOnCreate(el)
    }, 
    onremove: null, //tnOnRemove, 
    ondestroy: () => {
      if (instance) {
        instance.destroy()
        instance = null
      }
    }
  }
}
const SortableList = (
    {
      id, 
      group, 
      handle, 
      onSortStart, 
      onSortEnd, 
      collapsed = false, 
      isRoot = false
    }, children) => {
  const {oncreate, onremove, ondestroy} = instantiateSortable({group, handle, onSortStart, onSortEnd}) 
  const style = isRoot ? {} : {'max-height':children.length*40+"px"}
  return (
    <div class={`wq-SortableList ${collapsed ? 'wq-is-collapsed' : ''} ${isRoot ? 'wq-is-root' : ''}`} id={id} key={id} style={style} oncreate={oncreate} ondestroy={ondestroy}>
      {children}
    </div>
  )
}

const ImageInput = (
    {
      name, 
      src, 
      onimageselect
    }) => {
  const open = () => {
    selectImage(name, onimageselect)
  }
  const clear = () => {
    onimageselect({name, image:null})
  }
  return (
    <div class="wq-ImageInput">
      <Image src={src || noimageUrl} />
      <button type="button" class="button" onclick={open}>{_T('Open Media')}</button>
      <button type="button" class="button" onclick={clear} disabled={!src}>{_T('Clear')}</button>
    </div>
  )
}

const Control = (
    {
      label, 
      required, 
      message, 
      note
    }, children) => {
  return (
    <tr>
      <th scope="row">
        <label>{label}</label>
        <Message>{message}</Message>
      </th>
      <td>
        {children}
        <p class="description">{note}</p>
      </td>
    </tr>
  )
}

const IconButton = (
    {
      icon, 
      title, 
      onclick, 
      appearance = 'normal',  // danger, primary
      disabled = false, 
      xclass = '', 
      ...props
    }) => {
  return (
    <button type="button" class={`wq-IconButton wq-appearance-${appearance} ${xclass}`} onclick={onclick} disabled={disabled} title={title} {...props}>
      <i class="material-icons">{icon}</i>
    </button>
  )
}

// general tab
const general = {
  createInitialState: (form) => {
    const general = {title: form.title, navigator: form.navigator, doConfirm: form.doConfirm, thanksUrl: form.thanksUrl}
    return {
      formId: form.id, 
      general, 
      form: general, 
      messages: {}
    }
  }, 
  actions: {
    onchange: (ev) => ({form, ...rest}, actions) => {
      const doConfirm = ev.currentTarget.value == "true"
      return {...rest, form:{...form, doConfirm}}
    }, 
    onenumchange: (ev) => ({form, ...rest}, actions) => {
      const name = ev.currentTarget.name
      const val = ev.currentTarget.value
      return {...rest, form:{...form, [name]:val}}
    }, 
    oninput: (ev) => ({form, ...rest}, actions) => {
      return {form:{...form, [ev.currentTarget.name]:ev.currentTarget.value}, ...rest}
    }, 
    onblur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      const v = validate.General
      v(copy)
      messages = updateMessages(messages, path, v.errors)
      return {messages, ...rest}
    }, 
    onSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const v = validate.General
      if (! v(copy)) {
        messages = createMessages(v.errors)
        focusErrorInput(v.errors)
        return {...rest, messages}
      }
      window.requestAnimationFrame(() => {
        allActions.showNotice('Changes committed. Be sure to save data before moving to another page.')
      })
      return {...rest, messages:{}, general:copy}
    }, 
    onDismiss: (ev) => (state, actions) => {
      return {...state, messages:{}, form:state.general}
    }, 
    updateId: (id) => (state, actions) => {
      return {...state, formId:id}
    }
  }, 
  view: (state, actions) => {
    return (
      <form novalidate key="form-general" id="form-general">
        <table class="form-table">
          <tbody>
            {state.formId > 0 ? (
              <Control label={_T('Shortcode')} note={_T('Embed the shortcode above in a post or a page to display this.')}>
                <input type="text" readonly value={`[aforms-form id="${state.formId}"]`} class="large-text" />
              </Control>
            ) : null}
            <Control label={_T('Title')} note={_T('The name for you to distinguish the form. The end-users don\'t see this.')} message={_T(state.messages['.title'])}>
              <input type="text" name="title" value={""+state.form.title} class="regular-text" oninput={actions.oninput} onblur={actions.onblur} />
            </Control>
            <Control label={_T('Navigator')} message={_T(state.messages['.navigator'])}>
              <fieldset>
                <label><input type="radio" name="navigator" value="horizontal" checked={state.form.navigator == "horizontal"} onchange={actions.onenumchange} /><span>{_T('Flow format')}</span></label>
                <label><input type="radio" name="navigator" value="wizard" checked={state.form.navigator == "wizard"} onchange={actions.onenumchange} /><span>{_T('Wizard format')}</span></label>
              </fieldset>
            </Control>
            <Control label={_T('Display Confirmation Screen')} message={_T(state.messages['.doConfirm'])}>
              <fieldset>
                <label><input type="radio" name="doConfirm" value="true" checked={state.form.doConfirm} onchange={actions.onchange} /><span>{_T('Display')}</span></label>
                <label><input type="radio" name="doConfirm" value="false" checked={!state.form.doConfirm} onchange={actions.onchange} /><span>{_T('Don\'t Display')}</span></label>
              </fieldset>
            </Control>
            <Control label={_T('Thanks Url')} message={_T(state.messages['.thanksUrl'])} note={_T('If you want to display another page after submitting the form, enter the URL.')}>
              <input type="text" name="thanksUrl" value={state.form.thanksUrl} class="large-text" oninput={actions.oninput} onblur={actions.onblur} />
            </Control>
          </tbody>
        </table>
        <p class="submit">
          <button type="button" class="button button-primary" onclick={actions.onSettle}>{_T('Commit Changes')}</button>
          <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
        </p>
      </form>
    )
  }
}

const priceCheckerEnum = [{v:'equal',l:'Equal'},{v:'notEqual',l:'Not Equal'},{v:'greaterThan',l:'Greater Than'},{v:'greaterEqual',l:'Greater Equal'},{v:'lessThan',l:'Less Than'},{v:'lessEqual',l:'Less Equal'}]

const listQuantities = (id, items) => {
  return items.filter((item) => (item.type == "Quantity" || item.type == "Slider" || item.type == "AutoQuantity") && item.id != id)
}
const isTypeAddable = (form, type) => {
  if (! form || (form.type != 'Selector' && form.type != 'Option' && form.type != 'QuantOption')) {
    return (type != 'Option' && type != 'QuantOption')
  } else if (form.type == 'Selector') {
    return true
  } else {  // form.type is Option or QuantOption
    return (type == 'Option' || type == 'QuantOption')
  }
}

// Details tab
const details = {
  createInitialState: (form) => {
    const optionIds = (cur, item) => {
      if (item.type == "Selector") {
        return [...cur, ...item.options.map(o => o.id)]
      } else {
        return cur
      }
    }
    return {
      items: form.detailItems, 
      path: [], 
      form: null, 
      messages: {}, 
      sorting: null, 
      collapsing: {}, 
      nextItemId: Math.max(0, ...form.detailItems.map(x => x.id)) + 1, 
      nextOptionId: Math.max(0, ...form.detailItems.reduce(optionIds, [])) + 1, 
      spShowNav: true, 
      popping: false
    }
  }, 
  actions: {
    onShowNav: (ev) => (state, actions) => {
      return {...state, spShowNav:true}
    }, 
    onHideNav: (ev) => (state, actions) => {
      return {...state, spShowNav:false}
    }, 
    onDuplicate: (ev) => (state, actions) => {
      if (state.form.type != "Option" && state.form.type != "QuantOption") {
        const idx = findIndexByProp("id", state.path[0], state.items)
        const item = deepCopy(state.items[idx])
        let nextItemId = state.nextItemId
        item.id = nextItemId++
        item.name = sprintf(_T('%s\'s Copy'), item.name)
        let nextOptionId = state.nextOptionId
        if (state.form.type == "Selector") {
          item.options.forEach(option => {
            option.id = nextOptionId++
          })
        }
        return {...state, nextItemId, nextOptionId, items:linsert(state.items, idx + 1, item), form:item, path:[item.id], messages:{}}
      } else { // Option or QuantOption
        const idx0 = findIndexByProp("id", state.path[0], state.items)
        const idx1 = findIndexByProp("id", state.path[1], state.items[idx0].options)
        const option = deepCopy(state.items[idx0].options[idx1])
        let nextOptionId = state.nextOptionId
        option.id = nextOptionId++
        option.name = sprintf(_T('%s\'s Copy'), option.name)
        const item = {...state.items[idx0], options:linsert(state.items[idx0].options, idx1 + 1, option)}
        return {...state, nextOptionId, items:lreplace(state.items, idx0, item), form:option, path:[item.id, option.id], messages:{}}
      }
    }, 
    onDelete: (ev) => (state, actions) => {
      if (state.form.type == "Option" || state.form.type == "QuantOption") {
        const idx0 = findIndexByProp("id", state.path[0], state.items)
        const idx1 = findIndexByProp("id", state.path[1], state.items[idx0].options)
        const item = {...state.items[idx0], options:lremove(state.items[idx0].options, idx1)}
        return {...state, items:lreplace(state.items, idx0, item), form:null, path:[], messages:{}}
      } else {
        const idx = findIndexByProp("id", state.path[0], state.items)
        return {...state, items:lremove(state.items, idx), form:null, path:[], messages:{}}
      }
    }, 
    onAddAuto: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"Auto", category:"", name:_T('New Auto Item'), normalPrice:null, price:'100', priceAst:100, priceVars:[], taxRate:null, depends:"", quantity:-1}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddAdjustment: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"Adjustment", category:"", name:_T('New Adjustment Item'), normalPrice:null, price:'100', priceAst:100, priceVars:[], taxRate:null, depends:"", quantity:-1}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddSelector: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"Selector", image:"", name:_T('New Selector Item'), note:"", multiple:false, quantity:-1, options:[]}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddOption: (ev) => (state, actions) => {
      const idx0 = findIndexByProp("id", state.path[0], state.items)
      const idx1 = state.path.length == 1 ? 0 : findIndexByProp("id", state.path[1], state.items[idx0].options) + 1
      let nextOptionId = state.nextOptionId
      const option = {id:nextOptionId++, type:"Option", image:"", name:_T('New Option'), note:"", normalPrice:null, price:100, taxRate:null, ribbons:{}, labels:"", depends:""}
      const item = {...state.items[idx0], options:linsert(state.items[idx0].options, idx1, option)}
      return {...state, items:lreplace(state.items, idx0, item), nextOptionId, form:option, path:[item.id, option.id], messages:{}}
    }, 
    onAddQuantOption: (ev) => (state, actions) => {
      const idx0 = findIndexByProp("id", state.path[0], state.items)
      const idx1 = state.path.length == 1 ? 0 : findIndexByProp("id", state.path[1], state.items[idx0].options) + 1
      let nextOptionId = state.nextOptionId
      const option = {id:nextOptionId++, type:"QuantOption", image:"", name:_T('New Option with Quantity'), note:"", normalPrice:null, price:100, taxRate:null, ribbons:{}, labels:"", depends:"", minimum:1, maximum:5, step:1, suffix:""}
      const item = {...state.items[idx0], options:linsert(state.items[idx0].options, idx1, option)}
      return {...state, items:lreplace(state.items, idx0, item), nextOptionId, form:option, path:[item.id, option.id], messages:{}}
    }, 
    onAddPriceWatcher: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"PriceWatcher", lower:null, lowerIncluded:false, higher:null, higherIncluded:false, labels:""}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddQuantityWatcher: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"QuantityWatcher", target:-1, lower:null, lowerIncluded:false, higher:null, higherIncluded:false, labels:""}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddQuantity: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"Quantity", image:"", name:_T('New Quantity Item'), suffix:'', note:"", depends:"", allowFraction:true, initial:1, minimum:null, maximum:null}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddSlider: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"Slider", image:"", name:_T('New Slider Item'), suffix:'', note:"", depends:"", initial:1, minimum:1, maximum:10, step:1}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddAutoQuantity: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"AutoQuantity", image:"", name:_T('New Auto Quantity Item'), quantity:'1', quantityAst:1, quantityVars:[]}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onAddStop: (ev) => (state, actions) => {
      const idx = (state.form) ? findIndexByProp("id", state.path[0], state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type:"Stop", message:"Error", depends:""}
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, path:[item.id], messages:{}}
    }, 
    onOuterSortStart: ({id:_id, index}) => (state, actions) => {
      return {...state, sorting:"outer"}
    }, 
    onOuterSortEnd: ({fromId, fromIndex, toId:_toId, toIndex}) => (state, actions) => {
      return {...state, sorting:null, items:lmove(state.items, fromIndex, toIndex)}
    }, 
    onInnerSortStart: ({id, index}) => (state, actions) => {
      return {...state, sorting:'inner'}
    }, 
    onInnerSortEnd: ({fromId, fromIndex, toId, toIndex}) => (state, actions) => {
      const from = findIndexByProp("id", branchNo(fromId, '-'), state.items)
      const to = findIndexByProp("id", branchNo(toId, '-'), state.items)
      if (from != to) {
        const option = state.items[from].options[fromIndex]
        const fromSelector = {...state.items[from], options:lremove(state.items[from].options, fromIndex)}
        const toSelector = {...state.items[to], options:linsert(state.items[to].options, toIndex, option)}
        return {
          ...state, 
          sorting:null, 
          items: lreplace(lreplace(state.items, from, fromSelector), to, toSelector)
        }
      } else {
        const selector = {...state.items[from], options:lmove(state.items[from].options, fromIndex, toIndex)}
        return {
          ...state, 
          sorting:null, 
          items: lreplace(state.items, from, selector)
        }
      }
    }, 
    onOuterSelect: (ev) => (state, actions) => {
      const idx = ev.currentTarget.parentNode.id.split('-')[1]
      const item = state.items[idx]
      return {...state, path:[item.id], form:item, messages:{}}
    }, 
    onInnerSelect: (ev) => (state, actions) => {
      const indice = ev.currentTarget.parentNode.id.split('-')
      const selector = state.items[indice[1]]
      const option = selector.options[indice[2]]
      return {...state, path:[selector.id, option.id], form:option, messages:{}}
    }, 
    onToggle: (ev) => ({collapsing, ...rest}, actions) => {
      const idx = ev.currentTarget.parentNode.id.split('-')[1]
      const id = rest.items[idx].id
      if (collapsing.hasOwnProperty(id)) {
        collapsing = {...collapsing}
        delete collapsing[id]
        return {collapsing, ...rest}
      } else {
        return {collapsing:{...collapsing, [id]:true}, ...rest}
      }
    }, 
    onImageSelect: ({name, image}) => ({form, ...rest}, actions) => {
      return {...rest, form:{...form, [name]:image ? image.url : null}}
    }, 
    onInput: (ev) => ({form, ...rest}, actions) => {
      return {...rest, form:{...form, [ev.currentTarget.name]:ev.currentTarget.value}}
    }, 
    onVarChange: (ev) => ({form, ...rest}, actions) => {
      const idx = ev.currentTarget.dataset.index
      const prop = ev.currentTarget.dataset.prop
      const v = {sym:ev.currentTarget.dataset.sym, ref:+ev.currentTarget.value}
      const vars = lreplace(form[prop], idx, v)
      form = {...form, [prop]:vars}
      return {...rest, form}
    }, 
    onSelectorBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name;
      validate.Selector(copy)
      messages = updateMessages(messages, path, validate.Selector.errors)
      return {messages:messages, ...rest}
    }, 
    onAutoBlur: (ev) => ({messages, form, ...rest}, actions) => {
      const copy = deepCopy(form)
      const path = '.'+ev.currentTarget.name;
      validate.Auto(copy)
      const errors = validate.Auto.errors || []
      if (path == '.price' && form.price) {
        try {
          const {ast, vars} = parse(form.price)
          const priceVars = appendVars(form.priceVars, vars)
          form = {...form, priceAst:ast, priceVars}
        } catch (ex) {
          errors.push({dataPath:path, message:ex})
        }
      }
      messages = updateMessages(messages, path, errors)
      return {messages:messages, form, ...rest}
    }, 
    onAdjustmentBlur: (ev) => ({messages, form, ...rest}, actions) => {
      const copy = deepCopy(form)
      const path = '.'+ev.currentTarget.name;
      validate.Adjustment(copy)
      const errors = validate.Adjustment.errors || []
      if (path == '.price' && form.price) {
        try {
          const {ast, vars} = parse(form.price)
          const priceVars = appendVars(form.priceVars, vars)
          form = {...form, priceAst:ast, priceVars}
        } catch (ex) {
          errors.push({dataPath:path, message:ex})
        }
      }
      messages = updateMessages(messages, path, errors)
      return {messages:messages, form, ...rest}
    }, 
    onQuantityBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      validate.Quantity(copy)
      messages = updateMessages(messages, path, validate.Quantity.errors)
      return {messages:messages, ...rest}
    }, 
    onSliderBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      validate.Slider(copy)
      messages = updateMessages(messages, path, validate.Slider.errors)
      return {messages:messages, ...rest}
    }, 
    onOptionBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name;
      validate.Option(copy)
      messages = updateMessages(messages, path, validate.Option.errors)
      return {messages:messages, ...rest}
    }, 
    onQuantOptionBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      validate.QuantOption(copy)
      messages = updateMessages(messages, path, validate.QuantOption.errors)
      return {messages:messages, ...rest}
    }, 
    onPriceWatcherBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      validate.PriceWatcher(copy)
      messages = updateMessages(messages, path, validate.PriceWatcher.errors)
      return {messages, ...rest}
    }, 
    onQuantityWatcherBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      validate.QuantityWatcher(copy)
      messages = updateMessages(messages, path, validate.QuantityWatcher.errors)
      return {messages, ...rest}
    }, 
    onAutoQuantityBlur: (ev) => ({messages, form, ...rest}, actions) => {
      const copy = deepCopy(form)
      const path = '.'+ev.currentTarget.name;
      validate.AutoQuantity(copy)
      const errors = validate.AutoQuantity.errors || []
      if (path == '.quantity') {
        try {
          const {ast, vars} = parse(form.quantity)
          const quantityVars = appendVars(form.quantityVars, vars)
          form = {...form, quantityAst:ast, quantityVars}
        } catch (ex) {
          errors.push({dataPath:path, message:ex})
        }
      }
      messages = updateMessages(messages, path, errors)
      return {messages:messages, form, ...rest}
    }, 
    onStopBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      validate.Stop(copy)
      messages = updateMessages(messages, path, validate.Stop.errors)
      return {messages, ...rest}
    }, 
    onChange: (ev) => ({form, ...rest}, actions) => {
      const value = ev.currentTarget.value == "true"
      return {...rest, form:{...form, [ev.currentTarget.name]:value}}
    }, 
    onChangeValue: (ev) => ({form, ...rest}, actions) => {
      const value = ev.currentTarget.value
      return {...rest, form:{...form, [ev.currentTarget.name]:value}}
    }, 
    onRibbonChange: (ev) => ({form, ...rest}, actions) => {
      const name = ev.currentTarget.name
      var ribbons = {...form.ribbons}
      if (ev.currentTarget.checked) {
        ribbons[name] = true
      } else {
        delete ribbons[name]
      }
      form = {...form, ribbons}
      return {...rest, form}
    }, 
    onSelectorSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.Selector(copy)) {
        const messages = createMessages(validate.Selector.errors)
        focusErrorInput(validate.Selector.errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onAutoSettle: (ev) => ({messages, form, ...rest}, actions) => {
      const copy = deepCopy(form)
      validate.Auto(copy)
      const errors = validate.Auto.errors || []
      if (form.price) {
        try {
          const {ast, vars} = parse(form.price)
          const priceVars = appendVars(form.priceVars, vars)
          form = {...form, priceAst:ast, priceVars}
        } catch (ex) {
          errors.push({dataPath:'.price', message:ex})
        }
      }
      if (errors.length) {
        const messages = createMessages(errors)
        focusErrorInput(errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onAdjustmentSettle: (ev) => ({messages, form, ...rest}, actions) => {
      const copy = deepCopy(form)
      validate.Adjustment(copy)
      const errors = validate.Adjustment.errors || []
      if (form.price) {
        try {
          const {ast, vars} = parse(form.price)
          const priceVars = appendVars(form.priceVars, vars)
          form = {...form, priceAst:ast, priceVars}
        } catch (ex) {
          errors.push({dataPath:'.price', message:ex})
        }
      }
      if (errors.length) {
        const messages = createMessages(errors)
        focusErrorInput(errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onQuantitySettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.Quantity(copy)) {
        const messages = createMessages(validate.Quantity.errors)
        focusErrorInput(validate.Quantity.errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onSliderSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.Slider(copy)) {
        const messages = createMessages(validate.Slider.errors)
        focusErrorInput(validate.Slider.errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onOptionSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.Option(copy)) {
        const messages = createMessages(validate.Option.errors)
        focusErrorInput(validate.Option.errors)
        return {...rest, messages}
      }
      const idx0 = findIndexByProp("id", rest.path[0], rest.items)
      const idx1 = findIndexByProp("id", rest.path[1], rest.items[idx0].options)
      const options = lreplace(rest.items[idx0].options, idx1, copy)
      const item = {...rest.items[idx0], options}
      const items = lreplace(rest.items, idx0, item)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onQuantOptionSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.QuantOption(copy)) {
        const messages = createMessages(validate.QuantOption.errors)
        focusErrorInput(validate.QuantOption.errors)
        return {...rest, messages}
      }
      const idx0 = findIndexByProp("id", rest.path[0], rest.items)
      const idx1 = findIndexByProp("id", rest.path[1], rest.items[idx0].options)
      const options = lreplace(rest.items[idx0].options, idx1, copy)
      const item = {...rest.items[idx0], options}
      const items = lreplace(rest.items, idx0, item)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onPriceWatcherSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.PriceWatcher(copy)) {
        const messages = createMessages(validate.PriceWatcher.errors)
        focusErrorInput(validate.PriceWatcher.errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onQuantityWatcherSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.QuantityWatcher(copy)) {
        const messages = createMessages(validate.QuantityWatcher.errors)
        focusErrorInput(validate.QuantityWatcher.errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onAutoQuantitySettle: (ev) => ({messages, form, ...rest}, actions) => {
      const copy = deepCopy(form)
      validate.AutoQuantity(copy)
      const errors = validate.AutoQuantity.errors || []
      if (true) {
        try {
          const {ast, vars} = parse(form.quantity)
          const quantityVars = appendVars(form.quantityVars, vars)
          form = {...form, quantityAst:ast, quantityVars}
        } catch (ex) {
          errors.push({dataPath:'.quantity', message:ex})
        }
      }
      if (errors.length) {
        const messages = createMessages(errors)
        focusErrorInput(errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onStopSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      if (! validate.Stop(copy)) {
        const messages = createMessages(validate.Stop.errors)
        focusErrorInput(validate.Stop.errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.path[0], rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, path:[], items, spShowNav:true}
    }, 
    onDismiss: (ev) => (state, actions) => {
      return {...state, messages:{}, form:null, path:[], spShowNav:true}
    }, 
    onOpenExtra: (ev) => (state, actions) => {
      return {...state, popping:true}
    }, 
    onCloseExtra: (ev) => (state, actions) => {
      return {...state, popping:false}
    }
  }, 
  view: (state, actions) => {
    return (
      <div class="wq-Details">
        <div class={`wq--nav ${state.spShowNav ? 'wq-is-spshown' : ''}`}>
          <div class="wq--tools">
            <IconButton icon={state.popping ? "expand_less" : "expand_more"} title={_T('Additional Menu')} onclick={state.popping ? actions.onCloseExtra : actions.onOpenExtra} />
            <IconButton icon="file_copy" title={_T('Duplicate')} onclick={actions.onDuplicate} disabled={!state.form} />
            <IconButton icon="delete" title={_T('Delete')} onclick={actions.onDelete} disabled={!state.form} />
            <div class="wq--spacer"></div>
            <IconButton icon="arrow_forward" title={_T('Close Nav')} onclick={actions.onHideNav} xclass="wq-for-close-nav" appearance={state.form ? 'primary' : 'normal'} />
          </div>
          <div class={`wq-Menu ${state.popping ? 'wq-is-open' : ''}`}>
            <button class="wq--item" onclick={actions.onAddAuto} disabled={!isTypeAddable(state.form, 'Auto')}><i class="material-icons">flag</i> {_T('Auto Item')}</button>
            <button class="wq--item" onclick={actions.onAddAdjustment} disabled={!isTypeAddable(state.form, 'Adjustment')}><i class="material-icons">local_offer</i> {_T('Adjustment Item')}</button>
            <button class="wq--item" onclick={actions.onAddSelector} disabled={!isTypeAddable(state.form, 'Selector')}><i class="material-icons">ballot</i> {_T('Selector Item')}</button>
            <button class="wq--item" onclick={actions.onAddOption} disabled={!isTypeAddable(state.form, 'Option')}><i class="material-icons">check_circle</i> {_T('Option')}</button>
            <button class="wq--item" onclick={actions.onAddQuantOption} disabled={!isTypeAddable(state.form, 'QuantOption')}><i class="material-icons">add_circle</i> {_T('Option with Quantity')}</button>
            <button class="wq--item" onclick={actions.onAddAutoQuantity} disabled={!isTypeAddable(state.form, 'AutoQuantity')}><i class="material-icons">outlined_flag</i> {_T('Auto Quantity Item')}</button>
            <button class="wq--item" onclick={actions.onAddQuantity} disabled={!isTypeAddable(state.form, 'Quantity')}><i class="material-icons">plus_one</i> {_T('Quantity Item')}</button>
            <button class="wq--item" onclick={actions.onAddSlider} disabled={!isTypeAddable(state.form, 'Slider')}><i class="material-icons">linear_scale</i> {_T('Slider Item')}</button>
            <button class="wq--item wq-kind-watcher" onclick={actions.onAddPriceWatcher} disabled={!isTypeAddable(state.form, 'PriceWatcher')}><i class="material-icons">money</i> {_T('Price Watcher')}</button>
            <button class="wq--item wq-kind-watcher" onclick={actions.onAddQuantityWatcher} disabled={!isTypeAddable(state.form, 'QuantityWatcher')}><i class="material-icons">plus_one</i> {_T('Quantity Watcher')}</button>
            <button class="wq--item" onclick={actions.onAddStop} disabled={!isTypeAddable(state.form, 'Stop')}><i class="material-icons">block</i> {_T('Stop')}</button>
          </div>
          <SortableList id="outer" handle=".wq--handle-outer" group='outer' onSortStart={actions.onOuterSortStart} onSortEnd={actions.onOuterSortEnd} isRoot>
            {state.items.map((item, i0) => {
              if (item.type == "Auto") {
                return (
                  <div class={`wq-ListItem wq-for-auto ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? 'wq-is-undroppable' : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">flag</i> {item.name}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "Adjustment") {
                return (
                  <div class={`wq-ListItem wq-for-adjustment ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? 'wq-is-undroppable' : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">local_offer</i> {item.name}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "PriceChecker") {
                return (
                  <div class={`wq-ListItem wq-for-priceChecker ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? 'wq-is-undroppable' : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">money</i> {_T(findByProp('v', item.equation, priceCheckerEnum).l)} {item.threshold}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "PriceWatcher") {
                return (
                  <div class={`wq-ListItem wq-for-priceWatcher wq-kind-watcher ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? 'wq-is-undroppable' : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">money</i> {item.lower != null ? item.lower + ' ' + _T(findByProp('v', item.lowerIncluded ? 'lessEqual' : 'lessThan', priceCheckerEnum).l) + ' ' : ''}X{item.higher != null ? ' ' + _T(findByProp('v', item.higherIncluded ? 'lessEqual' : 'lessThan', priceCheckerEnum).l) + ' ' + item.higher : ''}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "QuantityWatcher") {
                return (
                  <div class={`wq-ListItem wq-for-quantityWatcher wq-kind-watcher ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? 'wq-is-undroppable' : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">plus_one</i> {item.lower != null ? item.lower + ' ' + _T(findByProp('v', item.lowerIncluded ? 'lessEqual' : 'lessThan', priceCheckerEnum).l) + ' ' : ''}{item.target == -1 ? 'X' : findByProp('id', item.target, state.items).name}{item.higher != null ? ' ' + _T(findByProp('v', item.higherIncluded ? 'lessEqual' : 'lessThan', priceCheckerEnum).l) + ' ' + item.higher : ''}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "Quantity") {
                return (
                  <div class={`wq-ListItem wq-for-quantity ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? 'wq-is-undroppable' : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">plus_one</i> {item.name}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div> 
                )
              } else if (item.type == "Slider") {
                return (
                  <div class={`wq-ListItem wq-for-slider ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? "wq-is-undroppable" : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">linear_scale</i> {item.name}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "AutoQuantity") {
                return (
                  <div class={`wq-ListItem wq-for-autoQuantity ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? "wq-is-undroppable" : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">outlined_flag</i> {item.name}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "Stop") {
                return (
                  <div class={`wq-ListItem wq-for-Stop ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? "wq-is-undroppable" : ''}`} id={`item-${i0}`}>
                    <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                    <div class="wq--main" onclick={actions.onOuterSelect}>
                      <i class="material-icons">block</i> {item.message}
                    </div>
                    <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                  </div>
                )
              } else if (item.type == "Selector") {
                return (
                  <div class="wq--listItemWrap">
                    <div class={`wq-ListItem wq-for-selector ${state.path.length == 1 && state.path[0] == item.id ? 'wq-is-selected' : ''} ${state.sorting == "inner" ? 'wq-is-undroppable' : ''}`} id={`item-${i0}`}>
                      <div class={`wq--toggler ${state.collapsing.hasOwnProperty(item.id) ? 'wq-is-collapsing' : ''}`} onclick={actions.onToggle}><i class="material-icons">arrow_drop_down</i></div>
                      <div class="wq--main" onclick={actions.onOuterSelect}>
                        <i class="material-icons">ballot</i> {item.name}
                      </div>
                      <div class="wq--handle wq--handle-outer"><i class="material-icons">drag_handle</i></div>
                    </div>
                    <SortableList id={`inner-${item.id}`} handle=".wq--handle-inner" group="inner" onSortStart={actions.onInnerSortStart} onSortEnd={actions.onInnerSortEnd} collapsed={state.collapsing.hasOwnProperty(item.id)}>
                      {item.options.map((option, i1) => {
                        return (
                          <div class={`wq-ListItem wq-for-option ${state.path.length == 2 && state.path[1] == option.id ? 'wq-is-selected' : ''} ${state.sorting == "outer" ? 'wq-is-undroppable' : ''}`} id={`option-${i0}-${i1}`}>
                            <div class="wq--toggler wq-non-interactive"><i class="material-icons">arrow_drop_down</i></div>
                            <div class="wq--main" onclick={actions.onInnerSelect}>
                              <i class="material-icons">{option.type == 'Option' ? 'check_circle' : 'add_circle'}</i> {option.name}
                            </div>
                            <div class="wq--handle wq--handle-inner"><i class="material-icons">drag_handle</i></div>
                          </div>
                        )
                      })}
                    </SortableList>
                  </div>
                )
              }
            })}
          </SortableList>
        </div>
        <div class={`wq--form`}>
          <div class="wq--lobe">
            <IconButton icon="arrow_back" onclick={actions.onShowNav} title={_T('Open Nav')} />
          </div>
          {state.form && state.form.type == "Auto" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Adds a fixed detail line.')}>
                    <p>{_T('Auto Item')}</p>
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onAutoBlur} />
                  </Control>
                  <Control label={_T('Category')} message={_T(state.messages['.category'])} note={_T('Input here if you want to display a category name in a order detail.')}>
                    <input type="text" name="category" class="regular-text" value={state.form.category} oninput={actions.onInput} onblur={actions.onAutoBlur} />
                  </Control>
                  <Control label={_T('Regular Price')} message={_T(state.messages['.normalPrice'])} note={_T('You can display the manufacturer\'s desired price.')}>
                    <input type="text" name="normalPrice" class="medium-text" value={state.form.normalPrice} oninput={actions.onInput} onblur={actions.onAutoBlur} />
                  </Control>
                  <Control label={_T('Price')} message={_T(state.messages['.price'])}>
                    <input type="text" name="price" class="large-text" value={state.form.price} oninput={actions.onInput} onblur={actions.onAutoBlur} />
                    {state.form.priceVars.map((v, i) => {
                      return (
                        <div class="wq--binding" key={v.sym}>
                          <span>{v.sym} = </span>
                          <select name={`price-${v.sym}`} data-index={i} data-sym={v.sym} data-prop="priceVars" onchange={actions.onVarChange}>
                            <option value={-1} selected={v.ref == -1}>{_T('Total')}</option>
                            {listQuantities(state.form.id, state.items).map((qi) => {
                              return (
                                <option value={qi.id} selected={v.ref == qi.id}>{qi.name}</option>
                              )
                            })}
                          </select>
                        </div>
                      )
                    })}
                  </Control>
                  <Control label={_T('Quantity')} message={_T(state.messages['.quantity'])}>
                    <select name="quantity" onchange={actions.onChangeValue}>
                      <option value={-1} selected={state.form.quantity == -1}>{_T('Fixed To 1')}</option>
                      {listQuantities(state.form.id, state.items).map((qi) => {
                        return (
                          <option value={qi.id} selected={state.form.quantity == qi.id}>{qi.name}</option>
                        )
                      })}
                    </select>
                  </Control>
                  <Control label={_T('Tax Rate')} message={_T(state.messages['.taxRate'])} note={_T('The tax rate on common settings will be applied when you leave it blank.')}>
                    <input type="text" name="taxRate" class="small-text" value={state.form.taxRate} oninput={actions.onInput} onblur={actions.onAutoBlur} /> {_T('%')}
                  </Control>
                  <Control label={_T('Required Labels')} note={_T('Separete with ",". This item is availble only if all labels listed are satisfied.')} message={_T(state.messages['.depends'])}>
                    <input type="text" name="depends" class="regular-text" value={state.form.depends} oninput={actions.onInput} onblur={actions.onAutoBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onAutoSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "Adjustment" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Adds a fixed detail line to be excluded from the total.')}>
                    <p>{_T('Adjustment Item')}</p>
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onAdjustmentBlur} />
                  </Control>
                  <Control label={_T('Category')} message={_T(state.messages['.category'])} note={_T('Input here if you want to display a category name in a order detail.')}>
                    <input type="text" name="category" class="regular-text" value={state.form.category} oninput={actions.onInput} onblur={actions.onAdjustmentBlur} />
                  </Control>
                  <Control label={_T('Regular Price')} message={_T(state.messages['.normalPrice'])} note={_T('You can display the manufacturer\'s desired price.')}>
                    <input type="text" name="normalPrice" class="medium-text" value={state.form.normalPrice} oninput={actions.onInput} onblur={actions.onAdjustmentBlur} />
                  </Control>
                  <Control label={_T('Price')} message={_T(state.messages['.price'])}>
                    <input type="text" name="price" class="large-text" value={state.form.price} oninput={actions.onInput} onblur={actions.onAdjustmentBlur} />
                    {state.form.priceVars.map((v, i) => {
                      return (
                        <div class="wq--binding" key={v.sym}>
                          <span>{v.sym} = </span>
                          <select name={`price-${v.sym}`} data-index={i} data-sym={v.sym} data-prop="priceVars" onchange={actions.onVarChange}>
                            <option value={-1} selected={v.ref == -1}>{_T('Total')}</option>
                            {listQuantities(state.form.id, state.items).map((qi) => {
                              return (
                                <option value={qi.id} selected={v.ref == qi.id}>{qi.name}</option>
                              )
                            })}
                          </select>
                        </div>
                      )
                    })}
                  </Control>
                  <Control label={_T('Quantity')} message={_T(state.messages['.quantity'])}>
                    <select name="quantity" onchange={actions.onChangeValue}>
                      <option value={-1} selected={state.form.quantity == -1}>{_T('Fixed To 1')}</option>
                      {listQuantities(state.form.id, state.items).map((qi) => {
                        return (
                          <option value={qi.id} selected={state.form.quantity == qi.id}>{qi.name}</option>
                        )
                      })}
                    </select>
                  </Control>
                  <Control label={_T('Tax Rate')} message={_T(state.messages['.taxRate'])} note={_T('The tax rate on common settings will be applied when you leave it blank.')}>
                    <input type="text" name="taxRate" class="small-text" value={state.form.taxRate} oninput={actions.onInput} onblur={actions.onAdjustmentBlur} /> {_T('%')}
                  </Control>
                  <Control label={_T('Required Labels')} note={_T('Separete with ",". This item is availble only if all labels listed are satisfied.')} message={_T(state.messages['.depends'])}>
                    <input type="text" name="depends" class="regular-text" value={state.form.depends} oninput={actions.onInput} onblur={actions.onAdjustmentBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onAdjustmentSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == 'PriceChecker' ? (
            <p>{state.form.type} is not supported. Delete it from the form.</p>
          ) : null}
          {state.form && state.form.type == 'PriceWatcher' ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Monitors the estimated price and gives labels if the price is included in a spacified range.')}>
                    <p>{_T('Price Watcher')}</p>
                  </Control>
                  <Control label={_T('Lower Limit Value')} message={_T(state.messages['.lower'])} note={_T('Leave this blank if there are no lower limit.')}>
                    <input type="text" name="lower" class="medium-text" value={state.form.lower} oninput={actions.onInput} onblur={actions.onPriceWatcherBlur} />
                  </Control>
                  <Control label={_T('Includes Lower Limit Value')} message={_T(state.messages['.lowerIncluded'])}>
                    <fieldset>
                      <label><input type="radio" name="lowerIncluded" value="true" checked={state.form.lowerIncluded} onchange={actions.onChange} /><span>{_T('Include')}</span></label>
                      <label><input type="radio" name="lowerIncluded" value="false" checked={!state.form.lowerIncluded} onchange={actions.onChange} /><span>{_T("Don't Include")}</span></label>
                    </fieldset>
                  </Control>
                  <Control label={_T('Higher Limit Value')} message={_T(state.messages['.higher'])} note={_T('Leave this blank if there are no higher limit.')}>
                    <input type="text" name="higher" class="medium-text" value={state.form.higher} oninput={actions.onInput} onblur={actions.onPriceWatcherBlur} />
                  </Control>
                  <Control label={_T('Includes Higher Limit Value')} message={_T(state.messages['.higherIncluded'])}>
                    <fieldset>
                      <label><input type="radio" name="higherIncluded" value="true" checked={state.form.higherIncluded} onchange={actions.onChange} /><span>{_T('Include')}</span></label>
                      <label><input type="radio" name="higherIncluded" value="false" checked={!state.form.higherIncluded} onchange={actions.onChange} /><span>{_T("Don't Include")}</span></label>
                    </fieldset>
                  </Control>
                    <Control label={_T('Labels')} message={_T(state.messages['.labels'])} note={_T('Separate with ",". If the conditions are met, all the labels listed will be awarded.')}>
                      <input type="text" name="labels" class="regular-text" value={state.form.labels} oninput={actions.onInput} onblur={actions.onAutoBlur} />
                    </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onPriceWatcherSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "QuantityWatcher" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Monitors the specified quanaity and gives labels if the quantity is included in a specified range.')}>
                    <p>{_T('Quantity Watcher')}</p>
                  </Control>
                  <Control label={_T('Monitoring Target')} message={_T(state.messages['.target'])}>
                    <select name="target" onchange={actions.onChangeValue}>
                      <option value={-1} selected={state.form.target == -1}>{_T('No Target')}</option>
                      {listQuantities(state.form.id, state.items).map((qi) => {
                        return (
                          <option value={qi.id} selected={state.form.target == qi.id}>{qi.name}</option>
                        )
                      })}
                    </select>
                  </Control>
                  <Control label={_T('Lower Limit Value')} message={_T(state.messages['.lower'])} note={_T('Leave this blank if there are no lower limit.')}>
                    <input type="text" name="lower" class="medium-text" value={state.form.lower} oninput={actions.onInput} onblur={actions.onPriceWatcherBlur} />
                  </Control>
                  <Control label={_T('Includes Lower Limit Value')} message={_T(state.messages['.lowerIncluded'])}>
                    <fieldset>
                      <label><input type="radio" name="lowerIncluded" value="true" checked={state.form.lowerIncluded} onchange={actions.onChange} /><span>{_T('Include')}</span></label>
                      <label><input type="radio" name="lowerIncluded" value="false" checked={!state.form.lowerIncluded} onchange={actions.onChange} /><span>{_T("Don't Include")}</span></label>
                    </fieldset>
                  </Control>
                  <Control label={_T('Higher Limit Value')} message={_T(state.messages['.higher'])} note={_T('Leave this blank if there are no higher limit.')}>
                    <input type="text" name="higher" class="medium-text" value={state.form.higher} oninput={actions.onInput} onblur={actions.onPriceWatcherBlur} />
                  </Control>
                  <Control label={_T('Includes Higher Limit Value')} message={_T(state.messages['.higherIncluded'])}>
                    <fieldset>
                      <label><input type="radio" name="higherIncluded" value="true" checked={state.form.higherIncluded} onchange={actions.onChange} /><span>{_T('Include')}</span></label>
                      <label><input type="radio" name="higherIncluded" value="false" checked={!state.form.higherIncluded} onchange={actions.onChange} /><span>{_T("Don't Include")}</span></label>
                    </fieldset>
                  </Control>
                  <Control label={_T('Labels')} message={_T(state.messages['.labels'])} note={_T('Separate with ",". If the conditions are met, all the labels listed will be awarded.')}>
                    <input type="text" name="labels" class="regular-text" value={state.form.labels} oninput={actions.onInput} onblur={actions.onAutoBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onQuantityWatcherSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "Quantity" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Prompts to enter the quantity by hand.')}>
                    <p>{_T('Quantity Item')}</p>
                  </Control>
                  <Control label={_T('Image')} message={_T(state.messages['.image'])}>
                    <ImageInput name="image" src={state.form.image} onimageselect={actions.onImageSelect} />
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                  <Control label={_T('Allows Fraction')} message={_T(state.messages['.allowFraction'])}>
                    <fieldset>
                      <label><input type="radio" name="allowFraction" value="true" checked={state.form.allowFraction} onchange={actions.onChange} /><span>{_T('Allow')}</span></label>
                      <label><input type="radio" name="allowFraction" value="false" checked={!state.form.allowFraction} onchange={actions.onChange} /><span>{_T('Disallow')}</span></label>
                    </fieldset>
                  </Control>
                  <Control label={_T('Initial Value')} message={_T(state.messages['.initial'])}>
                    <input type="text" name="initial" value={state.form.initial} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                  <Control label={_T('Unit')} message={_T(state.messages['.suffix'])} note={_T('Input if you want to add a unit to the input field.')}>
                    <input type="text" name="suffix" value={state.form.suffix} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                  <Control label={_T('Minimum Value')} message={_T(state.messages['.minimum'])} note={_T('Can be empty.')}>
                    <input type="text" name="minimum" value={state.form.minimum} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                  <Control label={_T('Maximum Value')} message={_T(state.messages['.maximum'])} note={_T('Can be empty.')}>
                    <input type="text" name="maximum" value={state.form.maximum} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                  <Control label={_T('Note')} message={_T(state.messages['.note'])} note={_T('You can write in HTML.')}>
                    <textarea name="note" class="large-text" rows="3" value={state.form.note} oninput={actions.onInput} onblur={actions.onQuantityBlur}></textarea>
                  </Control>
                  <Control label={_T('Required Labels')} message={_T(state.messages['.depends'])} note={_T('Separete with ",". This item is availble only if all labels listed are satisfied.')}>
                    <input type="text" name="depends" class="regular-text" value={state.form.depends} oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onQuantitySettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "Slider" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Prompts to enter the quantity with slider.')}>
                    <p>{_T('Slider Item')}</p>
                  </Control>
                  <Control label={_T('Image')} message={_T(state.messages['.image'])}>
                    <ImageInput name="image" src={state.form.image} onimageselect={actions.onImageSelect} />
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onSliderBlur} />
                  </Control>
                  <Control label={_T('Initial Value')} message={_T(state.messages['.initial'])}>
                    <input type="text" name="initial" value={state.form.initial} class="medium-text" oninput={actions.onInput} onblur={actions.onSliderBlur} />
                  </Control>
                  <Control label={_T('Minimum Value')} message={_T(state.messages['.minimum'])}>
                    <input type="text" name="minimum" value={state.form.minimum} class="medium-text" oninput={actions.onInput} onblur={actions.onSliderBlur} />
                  </Control>
                  <Control label={_T('Maximum Value')} message={_T(state.messages['.maximum'])}>
                    <input type="text" name="maximum" value={state.form.maximum} class="medium-text" oninput={actions.onInput} onblur={actions.onSliderBlur} />
                  </Control>
                  <Control label={_T('Step Value')} message={_T(state.messages['.step'])}>
                    <input type="text" name="step" value={state.form.step} class="medium-text" oninput={actions.onInput} onblur={actions.onSliderBlur} />
                  </Control>
                  <Control label={_T('Unit')} message={_T(state.messages['.suffix'])} note={_T('Input if you want to add a unit to the input field.')}>
                    <input type="text" name="suffix" value={state.form.suffix} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                  <Control label={_T('Note')} message={_T(state.messages['.note'])} note={_T('You can write in HTML.')}>
                    <textarea name="note" class="large-text" rows="3" value={state.form.note} oninput={actions.onInput} onblur={actions.onQuantityBlur}></textarea>
                  </Control>
                  <Control label={_T('Required Labels')} message={_T(state.messages['.depends'])} note={_T('Separete with ",". This item is availble only if all labels listed are satisfied.')}>
                    <input type="text" name="depends" class="regular-text" value={state.form.depends} oninput={actions.onInput} onblur={actions.onQuantityBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onSliderSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "AutoQuantity" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Generates a quantity value.')}>
                    <p>{_T('Auto Quantity Item')}</p>
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onAutoQuantityBlur} />
                  </Control>
                  <Control label={_T('Quantity')} message={_T(state.messages['.quantity'])}>
                    <input type="text" name="quantity" class="large-text" value={state.form.quantity} oninput={actions.onInput} onblur={actions.onAutoQuantityBlur} />
                    {state.form.quantityVars.map((v, i) => {
                      return (
                        <div class="wq--binding" key={v.sym}>
                          <span>{v.sym} = </span>
                          <select name={`quantity-${v.sym}`} data-index={i} data-sym={v.sym} data-prop="quantityVars" onchange={actions.onVarChange}>
                            <option value={-1} selected={v.ref == -1}>{_T('Total')}</option>
                            {listQuantities(state.form.id, state.items).map((qi) => {
                              return (
                                <option value={qi.id} selected={v.ref == qi.id}>{qi.name}</option>
                              )
                            })}
                          </select>
                        </div>
                      )
                    })}
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onAutoQuantitySettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "Stop" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Stops form submission under certain conditions.')}>
                    <p>{_T('Stop')}</p>
                  </Control>
                  <Control label={_T('Message')} message={_T(state.messages['.note'])} note={_T('Appears when the form submission was stopped.')}>
                    <textarea name="message" class="large-text" rows="3" value={state.form.message} oninput={actions.onInput} onblur={actions.onStopBlur}></textarea>
                  </Control>
                  <Control label={_T('Required Labels')} note={_T('Separete with ",". Form submission is stopped if all of the above conditions are met.')} message={_T(state.messages['.depends'])}>
                    <input type="text" name="depends" class="regular-text" value={state.form.depends} oninput={actions.onInput} onblur={actions.onStopBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onStopSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "Selector" ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Creates a group of choices.')}>
                    <p>{_T('Selector Item')}</p>
                  </Control>
                  <Control label={_T('Image')} message={_T(state.messages['.image'])}>
                    <ImageInput name="image" src={state.form.image} onimageselect={actions.onImageSelect} />
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onSelectorBlur} />
                  </Control>
                  <Control label={_T('Note')} message={_T(state.messages['.note'])} note={_T('You can write in HTML.')}>
                    <textarea name="note" class="large-text" rows="3" value={state.form.note} oninput={actions.onInput} onblur={actions.onSelectorBlur}></textarea>
                  </Control>
                  <Control label={_T('Multiple Selection')} message={_T(state.messages['.multiple'])}>
                    <fieldset>
                      <label><input type="radio" name="multiple" value="true" checked={state.form.multiple} onchange={actions.onChange} /><span>{_T('Allow')}</span></label>
                      <label><input type="radio" name="multiple" value="false" checked={!state.form.multiple} onchange={actions.onChange} /><span>{_T('Disallow')}</span></label>
                    </fieldset>
                  </Control>
                  <Control label={_T('Quantity')} message={_T(state.messages['.quantity'])}>
                    <select name="quantity" onchange={actions.onChangeValue}>
                      <option value={-1} selected={state.form.quantity == -1}>{_T('Fixed To 1')}</option>
                      {listQuantities(state.form.id, state.items).map((qi) => {
                        return (
                          <option value={qi.id} selected={state.form.quantity == qi.id}>{qi.name}</option>
                        )
                      })}
                    </select>
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onSelectorSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "Option" ? (
            <form novalidate key={`form-${state.path[0]}-${state.path[1]}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('Adds a detail line if selected.')}>
                    <p>{_T('Option')}</p>
                  </Control>
                  <Control label={_T('Image')} message={_T(state.messages['.image'])}>
                    <ImageInput name="image" src={state.form.image} onimageselect={actions.onImageSelect} />
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onOptionBlur} />
                  </Control>
                  <Control label={_T('Note')} message={_T(state.messages['.note'])} note={_T('You can write in HTML.')}>
                    <textarea name="note" class="large-text" rows="3" value={state.form.note} oninput={actions.onInput} onblur={actions.onOptionBlur}></textarea>
                  </Control>
                  <Control label={_T('Regular Price')} message={_T(state.messages['.normalPrice'])} note={_T('You can display the manufacturer\'s desired price.')}>
                    <input type="text" name="normalPrice" class="medium-text" value={state.form.normalPrice} oninput={actions.onInput} onblur={actions.onOptionBlur} />
                  </Control>
                  <Control label={_T('Price')} message={_T(state.messages['.price'])} note={_T('If you leave this blank, no detail line will be added, even if it is selected.')}>
                    <input type="text" name="price" class="medium-text" value={state.form.price} oninput={actions.onInput} onblur={actions.onOptionBlur} />
                  </Control>
                  <Control label={_T('Tax Rate')} message={_T(state.messages['.taxRate'])} note={_T('The tax rate on common settings will be applied when you leave it blank.')}>
                    <input type="text" name="taxRate" class="small-text" value={state.form.taxRate} oninput={actions.onInput} onblur={actions.onOptionBlur} /> {_T('%')}
                  </Control>
                  <Control label={_T('Ribbons')} message={_T(state.messages['.doConfirm'])}>
                    <fieldset>
                      {['SALE', 'RECOMMENDED'].map((r) => (
                        <label><input type="checkbox" name={r} value={true} checked={state.form.ribbons.hasOwnProperty(r)} onchange={actions.onRibbonChange} /><span>{_T(r)}</span></label>
                      ))}
                    </fieldset>
                  </Control>
                  <Control label={_T('Labels')} message={_T(state.messages['.labels'])} note={_T('Separate with ",". If this option is selected, all the labels listed will be awarded.')}>
                    <input type="text" name="labels" class="regular-text" value={state.form.labels} oninput={actions.onInput} onblur={actions.onOptionBlur} />
                  </Control>
                  <Control label={_T('Required Labels')} message={_T(state.messages['.depends'])} note={_T('Separete with ",". This item is availble only if all labels listed are satisfied.')}>
                    <input type="text" name="depends" class="regular-text" value={state.form.depends} oninput={actions.onInput} onblur={actions.onOptionBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onOptionSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
          {state.form && state.form.type == "QuantOption" ? (
            <form novalidate key={`form-${state.path[0]}-${state.path[1]}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')} note={_T('If quantity is set, adds a detail line.')}>
                    <p>{_T('Option with Quantity')}</p>
                  </Control>
                  <Control label={_T('Image')} message={_T(state.messages['.image'])}>
                    <ImageInput name="image" src={state.form.image} onimageselect={actions.onImageSelect} />
                  </Control>
                  <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                    <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Note')} message={_T(state.messages['.note'])} note={_T('You can write in HTML.')}>
                    <textarea name="note" class="large-text" rows="3" value={state.form.note} oninput={actions.onInput} onblur={actions.onQuantOptionBlur}></textarea>
                  </Control>
                  <Control label={_T('Regular Price')} message={_T(state.messages['.normalPrice'])} note={_T('You can display the manufacturer\'s desired price.')}>
                    <input type="text" name="normalPrice" class="medium-text" value={state.form.normalPrice} oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Price')} message={_T(state.messages['.price'])} note={_T('If you leave this blank, no detail line will be added, even if it is selected.')}>
                    <input type="text" name="price" class="medium-text" value={state.form.price} oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Tax Rate')} message={_T(state.messages['.taxRate'])} note={_T('The tax rate on common settings will be applied when you leave it blank.')}>
                    <input type="text" name="taxRate" class="small-text" value={state.form.taxRate} oninput={actions.onInput} onblur={actions.onQuantOptionBlur} /> {_T('%')}
                  </Control>
                  <Control label={_T('Ribbons')} message={_T(state.messages['.doConfirm'])}>
                    <fieldset>
                      {['SALE', 'RECOMMENDED'].map((r) => (
                        <label><input type="checkbox" name={r} value={true} checked={state.form.ribbons.hasOwnProperty(r)} onchange={actions.onRibbonChange} /><span>{_T(r)}</span></label>
                      ))}
                    </fieldset>
                  </Control>
                  <Control label={_T('Minimum Value')} message={_T(state.messages['.minimum'])}>
                    <input type="text" name="minimum" value={state.form.minimum} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Maximum Value')} message={_T(state.messages['.maximum'])}>
                    <input type="text" name="maximum" value={state.form.maximum} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Step Value')} message={_T(state.messages['.step'])}>
                    <input type="text" name="step" value={state.form.step} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Unit')} message={_T(state.messages['.suffix'])} note={_T('Input if you want to add a unit to the input field.')}>
                    <input type="text" name="suffix" value={state.form.suffix} class="medium-text" oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Labels')} message={_T(state.messages['.labels'])} note={_T('Separate with ",". If this option is selected, all the labels listed will be awarded.')}>
                    <input type="text" name="labels" class="regular-text" value={state.form.labels} oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                  <Control label={_T('Required Labels')} message={_T(state.messages['.depends'])} note={_T('Separete with ",". This item is availble only if all labels listed are satisfied.')}>
                    <input type="text" name="depends" class="regular-text" value={state.form.depends} oninput={actions.onInput} onblur={actions.onQuantOptionBlur} />
                  </Control>
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onQuantOptionSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
        </div>
      </div>
    )
  }
}

// Attributes tab
const attributes = {
  createInitialState: (form) => {
    return {
      items: form.attrItems, 
      form: null, 
      messages: {}, 
      sorting: null, 
      nextItemId: Math.max(0, ...form.attrItems.map(x => x.id)) + 1, 
      spShowNav: true, 
      popping: false
    }
  }, 
  actions: {
    onShowNav: (ev) => (state, actions) => {
      return {...state, spShowNav:true}
    }, 
    onHideNav: (ev) => (state, actions) => {
      return {...state, spShowNav:false}
    }, 
    onDuplicate: (ev) => (state, actions) => {
      const idx = findIndexByProp("id", state.form.id, state.items)
      const item = deepCopy(state.items[idx])
      let nextItemId = state.nextItemId
      item.id = nextItemId++
      item.name = sprintf(_T('%s\'s Copy'), item.name)
      return {...state, nextItemId, items:linsert(state.items, idx + 1, item), form:item, messages:{}}
    }, 
    onDelete: (ev) => (state, actions) => {
      const idx = findIndexByProp("id", state.form.id, state.items)
      return {...state, items:lremove(state.items, idx), form:null, messages:{}}
    }, 
    onAdd: (ev) => (state, actions) => {
      const type = ev.currentTarget.value
      const idx = (state.form) ? findIndexByProp('id', state.form.id, state.items) + 1 : 0
      let nextItemId = state.nextItemId
      const item = {id:nextItemId++, type, required:true, name:_T('New Input Field'), note:""}
      if (type == "Name" || type == "Tel") {
        item.divided = false
      }
      if (type == "Name") {
        item.pattern = 'none'
      }
      if (type == "Email") {
        item.repeated = true
      }
      if (type == 'Address') {
        item.autoFill = 'none'
      }
      if (type == "Radio" || type == "Dropdown" || type == "MultiCheckbox") {
        item.options = _T('New Option')
      }
      if (type == "Radio" || type == "Checkbox" || type == 'Dropdown' || type == 'MultiCheckbox') {
        item.initialValue = "";
      }
      if (type == "Text") {
        item.multiline = false
        item.size = "normal"
      }
      if (type == "File") {
        item.multiple = false
        item.extensions = "jpeg, jpg, gif, png"
        item.maxsize = "500K"
      }
      if (type == "reCAPTCHA3") {
        delete item.required
        delete item.name
        delete item.note
        item.siteKey = ""
        item.secretKey = ""
        item.action = "order"
        item.threshold1 = 0.6
        item.threshold2 = 0.2
      }
      return {...state, items:linsert(state.items, idx, item), nextItemId, form:item, messages:{}}
    }, 
    onSortStart: ({id:_id, index}) => (state, actions) => {
      return {...state, sorting:"yes"}
    }, 
    onSortEnd: ({fromId, fromIndex, toId, toIndex}) => (state, actions) => {
      return {...state, sorting:null, items:lmove(state.items, fromIndex, toIndex)}
    }, 
    onSelect: (ev) => (state, actions) => {
      const idx = ev.currentTarget.parentNode.id.split('-')[1]
      const item = state.items[idx]
      return {...state, form:item, messages:{}}
    }, 
    onImageSelect: ({name, image}) => ({form, ...rest}, actions) => {
      return {...rest, form:{...form, [name]:image ? image.url : null}}
    }, 
    onInput: (ev) => ({form, ...rest}, actions) => {
      return {...rest, form:{...form, [ev.currentTarget.name]:ev.currentTarget.value}}
    }, 
    onBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      const v = validate[rest.form.type]
      v(copy)
      messages = updateMessages(messages, path, v.errors)
      return {messages, ...rest}
    }, 
    onChange: (ev) => ({form, ...rest}, actions) => {
      const value = ev.currentTarget.value == "true"
      return {...rest, form:{...form, [ev.currentTarget.name]:value}}
    }, 
    onChangeEnum: (ev) => ({form, ...rest}, actions) => {
      const value = ev.currentTarget.value
      return {...rest, form:{...form, [ev.currentTarget.name]:value}}
    }, 
    onSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const v = validate[rest.form.type]
      if (! v(copy)) {
        messages = createMessages(v.errors)
        focusErrorInput(v.errors)
        return {...rest, messages}
      }
      const idx = findIndexByProp("id", rest.form.id, rest.items)
      const items = lreplace(rest.items, idx, copy)
      return {...rest, messages:{}, form:null, items, spShowNav:true}
    }, 
    onDismiss: (ev) => (state, actions) => {
      return {...state, messages:{}, form:null, spShowNav:true}
    }, 
    onOpenExtra: (ev) => (state, actions) => {
      return {...state, popping:true}
    }, 
    onCloseExtra: (ev) => (state, actions) => {
      return {...state, popping:false}
    }
  }, 
  nameMap: {
    Name: 'Name', 
    Email: 'Mail Address', 
    Tel: 'Phone Number', 
    Address: 'Address', 
    Checkbox: 'Checkbox', 
    Radio: 'Radio Button', 
    Dropdown: 'Dropdown', 
    MultiCheckbox: 'Multiple Checkbox', 
    Text: 'Text', 
    reCAPTCHA3: 'reCAPTCHA v3', 
    File: 'File'
  }, 
  iconMap: {
    Name: 'person', 
    Email: 'mail', 
    Tel: 'phone', 
    Address: 'my_location', 
    Checkbox: 'check_box', 
    Radio: 'radio_button_checked', 
    Dropdown: 'arrow_drop_down_circle', 
    MultiCheckbox: 'done_all', 
    Text: 'text_fields', 
    reCAPTCHA3: 'security', 
    File: 'attachment'
  }, 
  view: (state, actions) => {
    const ns = attributes.nameMap
    return (
      <div class="wq-Details" key="details">
        <div class={`wq--nav ${state.spShowNav ? 'wq-is-spshown' : ''}`}>
          <div class="wq--tools">
            <IconButton icon={state.popping ? "expand_less" : "expand_more"} title={_T('Additional Menu')} onclick={state.popping ? actions.onCloseExtra : actions.onOpenExtra} />
            <IconButton icon="file_copy" title={_T('Duplicate')} onclick={actions.onDuplicate} disabled={!state.form} />
            <IconButton icon="delete" title={_T('Delete')} onclick={actions.onDelete} disabled={!state.form} />
            <div class="wq--spacer"></div>
            <IconButton icon="arrow_forward" title={_T('Close Nav')} onclick={actions.onHideNav} xclass="wq-for-close-nav" appearance={state.form ? 'primary' : ''} />
          </div>
          <div class={`wq-Menu ${state.popping ? 'wq-is-open' : ''}`}>
            <button class="wq--item" onclick={actions.onAdd} value="Name"><i class="material-icons">person</i> {_T(ns.Name)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="Email"><i class="material-icons">mail</i> {_T(ns.Email)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="Tel"><i class="material-icons">phone</i> {_T(ns.Tel)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="Address"><i class="material-icons">my_location</i> {_T(ns.Address)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="Checkbox"><i class="material-icons">check_box</i> {_T(ns.Checkbox)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="Radio"><i class="material-icons">radio_button_checked</i> {_T(ns.Radio)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="Dropdown"><i class="material-icons">arrow_drop_down_circle</i> {_T(ns.Dropdown)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="MultiCheckbox"><i class="material-icons">done_all</i> {_T(ns.MultiCheckbox)}</button>
            <button class="wq--item" onclick={actions.onAdd} value="Text"><i class="material-icons">text_fields</i> {_T(ns.Text)}</button>
            {fileEnabled ? (<button class="wq--item" onclick={actions.onAdd} value="File"><i class="material-icons">attachment</i> {_T(ns.File)}</button>) : null}
            <button class="wq--item" onclick={actions.onAdd} value="reCAPTCHA3"><i class="material-icons">security</i> {_T(ns.reCAPTCHA3)}</button>
          </div>
          <SortableList id="attributes" handle=".wq--handle-attributes" group="attributes" onSortStart={actions.onSortStart} onSortEnd={actions.onSortEnd} isRoot>
            {state.items.map((item, i0) => {
              return (
                <div class={`wq-ListItem wq-for-${item.type} ${state.form && state.form.id == item.id ? 'wq-is-selected' : ''}`} id={`attrItem-${i0}`}>
                  <div class="wq--main" onclick={actions.onSelect}>
                    <i class="material-icons">{attributes.iconMap[item.type]}</i> {item.type == "reCAPTCHA3" ? ns[item.type] : item.name}
                  </div>
                  <div class="wq--handle wq--handle-attributes"><i class="material-icons">drag_handle</i></div>
                </div>
              )
            })}
          </SortableList>
        </div>
        <div class={`wq--form`}>
          <div class="wq--lobe">
            <IconButton icon="arrow_back" onclick={actions.onShowNav} title={_T('Open Nav')} />
          </div>
          {state.form ? (
            <form novalidate key={`form-${state.form.id}`}>
              <table class="form-table wq-x-narrow">
                <tbody>
                  <Control label={_T('Type')}>
                    <p>{_T(ns[state.form.type])}</p>
                  </Control>
                  {state.form.type != "reCAPTCHA3" ? (
                    <Control label={_T('Name')} message={_T(state.messages['.name'])}>
                      <input type="text" name="name" class="regular-text" value={state.form.name} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ) : null}
                  {state.form.type != "reCAPTCHA3" ? (
                    <Control label={_T('Input Required')} message={_T(state.messages['.required'])}>
                      <fieldset>
                        <label><input type="radio" name="required" value="true" checked={state.form.required} onchange={actions.onChange} /><span>{_T('Required')}</span></label>
                        <label><input type="radio" name="required" value="false" checked={!state.form.required} onchange={actions.onChange} /><span>{_T('Optional')}</span></label>
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "Name" || state.form.type == "Tel" ? (
                    <Control label={_T('Split Input Field')} message={_T(state.messages['.divided'])}>
                      <fieldset>
                        <label><input type="radio" name="divided" value="true" checked={state.form.divided} onchange={actions.onChange} /><span>{_T('Split')}</span></label>
                        <label><input type="radio" name="divided" value="false" checked={!state.form.divided} onchange={actions.onChange} /><span>{_T('Don\'t Split')}</span></label>
                      </fieldset>
                    </Control>
                  ): null}
                  {state.form.type == "Name" ? (
                    <Control label={_T('Input Restriction')} message={_T(state.messages['.pattern'])}>
                      <fieldset>
                        <label><input type="radio" name="pattern" value="none" checked={state.form.pattern == "none"} onchange={actions.onChangeEnum} /><span>{_T('None')}</span></label>
                        <label><input type="radio" name="pattern" value="hiragana" checked={state.form.pattern == "hiragana"} onchange={actions.onChangeEnum} /><span>{_T('Japanese Hiragana')}</span></label>
                        <label><input type="radio" name="pattern" value="katakana" checked={state.form.pattern == "katakana"} onchange={actions.onChangeEnum} /><span>{_T('Japanese Katakana')}</span></label>
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "Email" ? (
                    <Control label={_T('Confirmation Input')} message={_T(state.messages['.repeated'])} note={_T('Whether to have email address entered twice for confirmation.')}>
                      <fieldset>
                        <label><input type="radio" name="repeated" value={true} checked={state.form.repeated} onchange={actions.onChange} /><span>{_T('Confirm')}</span></label>
                        <label><input type="radio" name="repeated" value={false} checked={!state.form.repeated} onchange={actions.onChange} /><span>{_T('Don\'t Confirm')}</span></label>
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "Address" ? (
                    <Control label={_T('Auto Completion')} message={_T(state.messages['.autoFill'])} note={_T('Choose a service to auto-complete address from zip code.')}>
                      <fieldset>
                        <label><input type="radio" name="autoFill" value="none" checked={state.form.autoFill == "none"} onchange={actions.onChangeEnum} /><span>{_T('None')}</span></label>
                        <label><input type="radio" name="autoFill" value="yubinbango" checked={state.form.autoFill == 'yubinbango'} onchange={actions.onChangeEnum} /><span>{_T('Yubinbango (Japan)')}</span></label>
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "Radio" || state.form.type == "Dropdown" || state.form.type == "MultiCheckbox" ? (
                    <Control label={_T('Options')} message={_T(state.messages['.options'])} note={_T('Separate them with ",".')}>
                      <input type="text" name="options" class="large-text" value={state.form.options} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ) : null}
                  {state.form.type == "Radio" || state.form.type == "Dropdown" || state.form.type == "MultiCheckbox" ? (
                    <Control label={_T('Initial Value')} message={_T(state.messages['.initialValue'])} note={state.form.type == "MultiCheckbox" ? _T('Separate them with ",".') : ''}>
                      <input type="text" name="initialValue" class="regular-text" value={state.form.initialValue} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ) : null}
                  {state.form.type == "Checkbox" ? (
                    <Control label={_T('Initial Value')} message={_T(state.messages['.initialValue'])}>
                      <fieldset>
                        <label><input type="radio" name="initialValue" value="" checked={state.form.initialValue == ""} onchange={actions.onChangeEnum} /><span>{_T('Off')}</span></label>
                        <label><input type="radio" name="initialValue" value="1" checked={state.form.initialValue != ""} onchange={actions.onChangeEnum} /><span>{_T('On')}</span></label>
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "Text" ? (
                    <Control label={_T('Number of Lines')} message={_T(state.messages['.multiline'])}>
                      <fieldset>
                        <label><input type="radio" name="multiline" value="true" checked={state.form.multiline} onchange={actions.onChange} /><span>{_T('Multiple Lines')}</span></label>
                        <label><input type="radio" name="multiline" value="false" checked={!state.form.multiline} onchange={actions.onChange} /><span>{_T('1 Line')}</span></label>
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "Text" ? (
                    <Control label={_T('Width of Input Field')} message={_T(state.messages['.size'])}>
                      <fieldset>
                        <label><input type="radio" name="size" value="nano" checked={state.form.size == "nano"} onchange={actions.onChangeEnum} /><span>{_T('Nano')}</span></label> {_T('Up to 3 characters.')}<br />
                        <label><input type="radio" name="size" value="mini" checked={state.form.size == "mini"} onchange={actions.onChangeEnum} /><span>{_T('Mini')}</span></label> {_T('Up to 5 characters.')}<br />
                        <label><input type="radio" name="size" value="small" checked={state.form.size == "small"} onchange={actions.onChangeEnum} /><span>{_T('Small')}</span></label> {_T('Up to 8 characters.')}<br />
                        <label><input type="radio" name="size" value="normal" checked={state.form.size == "normal"} onchange={actions.onChangeEnum} /><span>{_T('Regular')}</span></label> {_T('Up to 13 characters.')}<br />
                        <label><input type="radio" name="size" value="full" checked={state.form.size == "full"} onchange={actions.onChangeEnum} /><span>{_T('Full')}</span></label> {_T('Full width')}
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "File" ? (
                    <Control label={_T('Number of Files')} message={_T(state.messages['.multiple'])}>
                      <fieldset>
                        <label><input type="radio" name="multiple" value="false" checked={!state.form.multiple} onchange={actions.onChange} /><span>{_T('1 File')}</span></label>
                        <label><input type="radio" name="multiple" value="true" checked={state.form.multiple} onchange={actions.onChange} /><span>{_T('Multiple Files')}</span></label>
                      </fieldset>
                    </Control>
                  ) : null}
                  {state.form.type == "File" ? (
                    <Control label={_T('Acceptable Extensions')} message={_T(state.messages['.extensions'])} note={_T('Enter extensions separated by commas, without dots. It is not case-sensitive.')}>
                      <input type="text" name="extensions" class="large-text" value={state.form.extensions} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ) : null}
                  {state.form.type == "File" ? (
                    <Control label={_T('Max File Size')} message={_T(state.messages['.maxsize'])} note={_T('You can use magnifications of K, M, and G. If left blank, the size is unlimited.')}>
                      <input type="text" name="maxsize" class="regular-text" value={state.form.maxsize} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ) : null}
                  {state.form.type != "reCAPTCHA3" ? (
                    <Control label={_T('Note')} message={_T(state.messages['.note'])} note={_T('You can write in HTML.')}>
                      <textarea name="note" class="large-text" rows="3" value={state.form.note} oninput={actions.onInput} onblur={actions.onBlur}></textarea>
                    </Control>
                  ) : null}
                  {state.form.type == "reCAPTCHA3" ? [(
                    <Control label={_T('Site Key')} message={_T(state.messages['.siteKey'])} note={_T('If Site Key or Secret Key is blank, this item has no effect.')}>
                      <input type="text" name="siteKey" class="large-text" value={state.form.siteKey} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ), (
                    <Control label={_T('Secret Key')} message={_T(state.messages['.secretKey'])}>
                      <input type="text" name="secretKey" class="large-text" value={state.form.secretKey} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ), (
                    <Control label={_T('Action')} message={_T(state.messages['.action'])} note={[_T("A string that identifies the user's action. Refer: "), <a href="https://developers.google.com/recaptcha/docs/v3#actions" target="_blank">Actions</a>]}>
                      <input type="text" name="action" class="medium-text" value={state.form.action} oninput={actions.onInput} onblur={actions.onBlur} />
                    </Control>
                  ), (
                    <Control label={_T('Soft-Pass Score')} message={_T(state.messages['threshold1'])} note={_T("If the score is lower than this value, AForms considers that the submission is somewhat unreliable and email notifications to administrators will be omitted.")}>
                      <select name="threshold1" onchange={actions.onChangeEnum}>
                        {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(s => {
                          return (
                            <option value={s} selected={s == state.form.threshold1}>{s}</option>
                          )
                        })}
                      </select>
                    </Control>
                  ), (
                    <Control label={_T('Failure Score')} message={_T(state.messages['threshold2'])} note={_T("If the score is lower than this value, AForms blocks the submission and show an error to customer.")}>
                      <select name="threshold2" onchange={actions.onChangeEnum}>
                        {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(s => {
                          return (
                            <option value={s} selected={s == state.form.threshold2}>{s}</option>
                          )
                        })}
                      </select>
                    </Control>
                  )] : null}
                </tbody>
              </table>
              <p class="submit">
                <button type="button" class="button button-primary" onclick={actions.onSettle}>{_T('Commit Changes')}</button>
                <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
              </p>
            </form>
          ) : null}
        </div>
      </div>
    )
  }
}

// Mail tab
const mail = {
  createInitialState: (form) => {
    return {
      mail: form.mail, 
      form: form.mail, 
      messages: {}
    }
  }, 
  actions: {
    onInput: (ev) => ({form, ...rest}, actions) => {
      return {...rest, form:{...form, [ev.currentTarget.name]:ev.currentTarget.value}}
    }, 
    onBlur: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name
      const v = validate.Mail
      v(copy)
      messages = updateMessages(messages, path, v.errors)
      return {messages, ...rest}
    }, 
    onSettle: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const v = validate.Mail
      if (! v(copy)) {
        messages = createMessages(v.errors)
        focusErrorInput(v.errors)
        return {...rest, messages}
      }
      window.requestAnimationFrame(() => allActions.showNotice('Changes committed. Be sure to save data before moving to another page.'))
      return {...rest, messages:{}, mail:copy}
    }, 
    onDismiss: (ev) => (state, actions) => {
      return {...state, messages:{}, form:state.mail}
    }
  }, 
  view: (state, actions) => {
    const form = state.form
    return (
      <form novalidate id="form-mail" key="form-mail">
        <table class="form-table">
          <tbody>
            <Control label={_T('From Address')} message={_T(state.messages['.fromAddress'])}>
              <input type="text" class="large-text" name="fromAddress" value={form.fromAddress} oninput={actions.onInput} onblur={actions.onBlur} />
            </Control>
            <Control label={_T('From Name')} message={_T(state.messages['.fromName'])}>
              <input type="text" class="regular-text" name="fromName" value={form.fromName} oninput={actions.onInput} onblur={actions.onBlur} />
            </Control>
            <Control label={_T('Subject')} message={_T(state.messages['.subject'])}>
              <input type="text" class="large-text" name="subject" value={form.subject} oninput={actions.onInput} onblur={actions.onBlur} />
            </Control>
            <Control label={_T('Notify To')} message={_T(state.messages['.notifyTo'])} note={_T('You can also send a copy of the thank-you-mail to another address.')}>
              <input type="text" class="large-text" name="notifyTo" value={form.notifyTo} oninput={actions.onInput} onblur={actions.onBlur} />
            </Control>
            <Control label={_T('Text Body')} message={_T(state.messages['.textBody'])}>
              <p>{_T('You can insert the following data into the text body.')}</p>
              <dl class="wq--definitions">
                <dt>{'{{id}}'}</dt><dd>{_T('Order id')}</dd>
                <dt>{'{{details}}'}</dt><dd>{_T('Detail lines')}</dd>
                <dt>{'{{total}}'}</dt><dd>{_T('Total; In case of tax-excluded notation, subtotal and tax are included.')}</dd>
                <dt>{'{{attributes}}'}</dt><dd>{_T('Customer attributes')}</dd>
                <dt>{'{{name}}'}</dt><dd>{_T('Customer name; Available only when using Name control.')}</dd>
                <dt>{'{{email}}'}</dt><dd>{_T('Customer mail address; Available only when using MailAddress control.')}</dd>
              </dl>
              <textarea class="large-text" rows="20" name="textBody" value={form.textBody} oninput={actions.onInput} onblur={actions.onBlur}></textarea>
            </Control>
          </tbody>
        </table>
        <p class="submit">
          <button type="button" class="button button-primary" onclick={actions.onSettle}>{_T('Commit Changes')}</button>
          <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
        </p>
      </form>
    )
  }
}

// Extensions tab
const extensions = {
  compile: (ees) => {
    const db = ees.reduce((db, ee) => {
      db[ee] = true
      return db
    }, {})
    return availableExts.reduce((form, ae) => {
      form[ae.id] = db[ae.id]
      return form
    }, {})
  }, 
  decompile: (form) => {
    return availableExts.reduce((ees, ae) => {
      if (form[ae.id]) {
        ees.push(ae.id)
      }
      return ees
    }, [])
  }, 
  createInitialState: (form) => {
    return {
      extensions: form.extensions,  // id list of effective extensions
      form: extensions.compile(form.extensions), 
      messages: {}
    }
  }, 
  actions: {
    onChange: (ev) => (state, actions) => {
      const id = ev.currentTarget.dataset['id']
      const value = ev.currentTarget.checked
      const form = {...state.form, [id]:value}
      return {...state, form}
    }, 
    onSettle: (ev) => (state, actions) => {
      const aes = extensions.decompile(state.form)
      window.requestAnimationFrame(() => allActions.showNotice('Changes committed. Be sure to save data before moving to another page.'))
      return {...state, extensions:aes}
    }, 
    onDismiss: (ev) => (state, actions) => {
      const form = extensions.compile(state.extensions)
      return {...state, form}
    }
  }, 
  view: (state, actions) => {
    return (
      <form novalidate id="form-extensions" key="form-extensions">
        <p>{_T('Check the extensions to use in this form.')}</p>
        <table class="form-table">
          <tbody>
            <Control label={_T('Available Extensions')}>
              <fieldset>
                {availableExts.reduce((dom, ae) => {
                  const el = (
                    <label><input type="checkbox" name={ae.id} data-id={ae.id} value={true} checked={state.form[ae.id]} onchange={actions.onChange} /><span>{ae.title}</span></label>
                  )
                  dom.push(el, <br />)
                  return dom
                }, [])}
              </fieldset>
            </Control>
          </tbody>
        </table>
        <p class="submit">
          <button type="button" class="button button-primary" onclick={actions.onSettle}>{_T('Commit Changes')}</button>
          <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
        </p>
      </form>
    )
  }
}

// whole page
const createInitialState = (form) => {
  const rv = {
    general: general.createInitialState(form), 
    details: details.createInitialState(form), 
    attributes: attributes.createInitialState(form), 
    mail: mail.createInitialState(form), 
    extensions: extensions.createInitialState(form), 
    tab: 'general', 
    loading: false, 
    notification: null
  }
  return rv
}
const actions = {
  general: general.actions, 
  details: details.actions, 
  attributes: attributes.actions, 
  mail: mail.actions, 
  extensions: extensions.actions, 
  activate: (ev) => (state, actions) => {
    const off = ev.currentTarget.href.lastIndexOf('#')
    const tab = ev.currentTarget.href.slice(off + 1)
    return {...state, tab}
  }, 
  submit: (ev) => (state, actions) => {
    document.getElementById('save-button').setAttribute('disabled', 'disabled');
    const form = {
      id: state.general.formId, 
      title: state.general.general.title, 
      navigator: state.general.general.navigator, 
      doConfirm: state.general.general.doConfirm, 
      thanksUrl: state.general.general.thanksUrl, 
      detailItems: state.details.items, 
      attrItems: state.attributes.items, 
      mail: state.mail.mail, 
      extensions: state.extensions.extensions
    }
    submit(form, actions.submitK)
    return {...state, loading:true}
  }, 
  submitK: (resp) => (state, actions) => {
    if (resp.form.id != state.general.formId) {
      history.replaceState('', '', editUrl.replace('placeholder', resp.form.id))
      const pu = pvUrl.replace('placeholder', resp.form.id)
      document.getElementById('preview-link').href = pu
    }
    window.requestAnimationFrame(() => allActions.general.updateId(resp.form.id))
    window.requestAnimationFrame(() => allActions.showNotice('Form saved.'))
    document.getElementById('save-button').removeAttribute('disabled');
    return {...state, loading:false}
  }, 
  showNotice: (notification) => (state, actions) => {
    scrollToTop();
    return {...state, notification}
  }, 
  hideNotice: (ev) => (state, actions) => {
    return {...state, notification:null}
  }
}
const bind = (_el) => {
  const target = document.getElementById('save-button');
  target.addEventListener('click', allActions.submit)
}
const view = (state, actions) => {
  return (
    <div oncreate={bind}>
      {(state.notification) ? (
        <div class="updated settings-error notice is-dismissible">
          <p><strong>{_T(state.notification)}</strong></p>
          <button type="button" class="notice-dismiss" onclick={actions.hideNotice}><span class="screen-reader-text">{_T('Dismiss this notice.')}</span></button>
        </div>
      ) : null}
      <nav class="nav-tab-wrapper wp-clearfix">
        <a href="#general" onclick={actions.activate} class={`nav-tab ${state.tab == 'general' ? 'nav-tab-active' : ''}`}>{_T('General')}</a>
        <a href="#details" onclick={actions.activate} class={`nav-tab ${state.tab == 'details' ? 'nav-tab-active' : ''}`}>{_T('Details')}</a>
        <a href="#attributes" onclick={actions.activate} class={`nav-tab ${state.tab == 'attributes' ? 'nav-tab-active' : ''}`}>{_T('Attributes')}</a>
        <a href="#mail" onclick={actions.activate} class={`nav-tab ${state.tab == 'mail' ? 'nav-tab-active' : ''}`}>{_T('Mail')}</a>
        {availableExts.length > 0 ? (
          <a href="#extensions" onclick={actions.activate} class={`nav-tab ${state.tab == 'extensions' ? 'nav-tab-active' : ''}`}>{_T('Extensions')}</a>
        ) : null}
      </nav>
      {(state.tab == 'general') ? general.view(state.general, actions.general) : null}
      {(state.tab == 'details') ? details.view(state.details, actions.details) : null}
      {(state.tab == 'attributes') ? attributes.view(state.attributes, actions.attributes) : null}
      {(state.tab == 'mail') ? mail.view(state.mail, actions.mail) : null}
      {(state.tab == 'extensions') ? extensions.view(state.extensions, actions.extensions) : null}
    </div>
  )
}

const _T = translate(wqData.catalog);
const fileEnabled = wqData.fileEnabled;
const noimageUrl = wqData.noimageUrl;
const submitUrl = wqData.submitUrl;
const editUrl = wqData.editUrl;
const pvUrl = wqData.pvUrl;
const availableExts = wqData.extensions;
const allActions = app(createInitialState(wqData.form), actions, view, document.getElementById('root'))
const validate = mapHash((_name, s) => {
  return (new Ajv({coerceTypes: true, allErrors: true})).compile(s)
}, wqData.schemas);  // General, Auto, Selector, Option, ...
const parse = makeParser(_T)