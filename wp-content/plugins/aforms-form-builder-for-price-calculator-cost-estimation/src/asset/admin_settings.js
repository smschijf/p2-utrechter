
import { h, app } from 'hyperapp';
import Ajv from "ajv";
import { createMessages, updateMessages, translate, deepCopy, Message, focusErrorInput, scrollToTop, reduceHash, lreplace, strToVdom } from './admin_common';

const submit = (form, k) => {
  jQuery.ajax({
    type: "post", 
    url: submitUrl, 
    data: JSON.stringify(form), 
    contentType: 'application/json',
    success: function(response) {
      k(response)
    }, 
    dataType: 'json'
  });
}

const wordToForm = (word) => reduceHash((cur, key, val) => [...cur, {key, val}], [], word)
const formToWord = (form) => form.reduce((cur, e) => ({...cur, [e.key]:e.val}), {})

const actions = {
  rule: {
    change: (ev) => ({form, ...rest}, actions) => {
      if (ev.currentTarget.name == 'taxIncluded') {
        const taxIncluded = ev.currentTarget.value == "true"
        return {form:{...form, taxIncluded}, ...rest}
      } else if (ev.currentTarget.name == 'taxNormalizer') {
        const taxNormalizer = ev.currentTarget.value
        return {form:{...form, taxNormalizer}, ...rest}
      }
    }, 
    input: (ev) => ({form, ...rest}, actions) => {
      if (ev.currentTarget.name == 'taxRate') {
        return {form:{...form, taxRate:ev.currentTarget.value}, ...rest}
      } else if (ev.currentTarget.name == 'taxPrecision') {
        return {form:{...form, taxPrecision:ev.currentTarget.value}, ...rest}
      }
    }, 
    inputEnd: (ev) => ({messages, ...rest}, actions) => {
      const copy = deepCopy(rest.form)
      const path = '.'+ev.currentTarget.name; // taxRate or taxPrecision
      validate.rule(copy)
      messages = updateMessages(messages, path, validate.rule.errors)
      return {messages:messages, ...rest}
    }, 
    onSettle: (ev) => (state, actions) => {
      const copy = deepCopy(state.form)
      if (! validate.rule(copy)) {
        const messages = createMessages(v.errors)
        focusErrorInput(validate.rule.errors)
        return {...state, messages}
      }

      window.requestAnimationFrame(() => allActions.showNotice('Changes committed. Be sure to save data before moving to another page.'))
      return {...state, data:copy, messages:{}}
    }, 
    onDismiss: (ev) => (state, actions) => {
      return {...state, form:state.data, messages:{}}
    }
  }, 
  word: {
    input: (ev) => (state, actions) => {
      const idx = ev.currentTarget.name
      const ent = {...state.form[idx], val:ev.currentTarget.value}
      const form = lreplace(state.form, idx, ent)
      return {...state, form}
    }, 
    onSettle: (ev) => (state, actions) => {
      const copy = formToWord(state.form)

      window.requestAnimationFrame(() => allActions.showNotice('Changes committed. Be sure to save data before moving to another page.'))
      return {...state, data:copy, messages:{}}
    }, 
    onDismiss: (ev) => (state, actions) => {
      return {...state, form:wordToForm(state.data), messages:{}}
    }
    
  }, 
  behavior: {
    change: (ev) => ({form, ...rest}, actions) => {
      const smoothScroll = ev.currentTarget.value == "true"
      return {form:{...form, smoothScroll}, ...rest}
    }, 
    onSettle: (ev) => (state, actions) => {
      const copy = deepCopy(state.form)
      if (! validate.behavior(copy)) {
        const messages = createMessages(v.errors)
        focusErrorInput(validate.behavior.errors)
        return {...state, messages}
      }

      window.requestAnimationFrame(() => allActions.showNotice('Changes committed. Be sure to save data before moving to another page.'))
      return {...state, data:copy, messages:{}}
    }, 
    onDismiss: (ev) => (state, actions) => {
      return {...state, form:state.data, messages:{}}
    }
  }, 
  activate: (ev) => (state, actions) => {
    const off = ev.currentTarget.href.lastIndexOf('#')
    const tab = ev.currentTarget.href.slice(off + 1)
    return {...state, tab}
  }, 
  submit: (ev) => (state, actions) => {
    document.getElementById('save-button').setAttribute('disabled', 'disabled');
    const form = {
      rule: state.rule.data, 
      word: state.word.data, 
      behavior: state.behavior.data
    }
    submit(form, actions.submitK)
    return {...state, loading:true}
  }, 
  submitK: (resp) => (state, actions) => {
    window.requestAnimationFrame(() => allActions.showNotice('Settings saved.'))
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

// State = {settings, messages, loading, showNotice}
// messages = map of dataPath to keyword
const createInitialState = (rule, word, behavior) => {
  return {
    rule: {
      data: rule, 
      form: rule, 
      messages: {}
    }, 
    word: {
      data: word, 
      form: wordToForm(word), 
      messages: {}
    }, 
    behavior: {
      data: behavior, 
      form: behavior, 
      messages: {}
    }, 
    tab: 'rule', 
    loading: false, 
    notification: null
  }
}

const viewRule = (state, actions) => {
  const taxNormalizers = [
    {value:'floor', label:_T('Round Down'),     note:'100.5 -> 100, -100.1 -> -101'}, 
    {value:'ceil',  label:_T('Round Up'),     note:'100.5 -> 101, -100.1 -> -100'}, 
    {value:'round', label:_T('Round Off'),     note:'100.5 -> 101, -100.1 -> -100'}, 
    {value:'trunc', label:_T('Truncate'),     note:'100.5 -> 100, -100.1 -> -100'}
  ]
  return (
    <form novalidate key="rule">
      <table class="form-table">
        <tbody>
          <tr>
            <th scope="row">
              <label>{_T('Tax Notation')}</label>
              <Message>{_T(state.messages['.taxIncluded'])}</Message>
            </th>
            <td>
              <fieldset>
                <label><input type="radio" name="taxIncluded" value="true" checked={""+state.form.taxIncluded == "true"} onchange={actions.change}></input><span>{_T('Tax Included')}</span></label>
                <br></br>
                <label><input type="radio" name="taxIncluded" value="false" checked={""+state.form.taxIncluded == "false"} onchange={actions.change}></input><span>{_T('Tax Excluded')}</span></label>
              </fieldset>
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label>{_T('Tax Rate')}</label>
              <Message>{_T(state.messages['.taxRate'])}</Message>
            </th>
            <td>
              <input type="text" name="taxRate" value={""+state.form.taxRate} class="small-text" oninput={actions.input} onblur={actions.inputEnd} /> {_T('%')}
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label>{_T('Fraction Processing')}</label>
              <Message>{_T(state.messages['.taxNormalizer'])}</Message>
            </th>
            <td>
              <fieldset>
                {taxNormalizers.map(n => {
                  return ([
                    <label><input type="radio" name="taxNormalizer" value={n.value} checked={state.form.taxNormalizer == n.value} onchange={actions.change}></input> {n.label} -- {n.note}</label>, 
                    <br></br>
                  ])
                })}
              </fieldset>
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label>{_T('Processing Precision')}</label>
              <Message>{_T(state.messages['.taxPrecision'])}</Message>
            </th>
            <td>
              <input type="text" name="taxPrecision" value={""+state.form.taxPrecision} class="small-text" oninput={actions.input} onblur={actions.inputEnd} />
              <p class="description">{_T('The number of digits left by rounding. If "1" is specified, the processing result will be "12.3".')}</p>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="submit">
        <button type="button" class="button button-primary" onclick={actions.onSettle}>{_T('Commit Changes')}</button>
        <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
      </p>
    </form>
  )
}

const viewWord = (state, actions) => {
  return (
    <form novalidate>
      <table class="form-table">
        <tbody>
          {state.form.map((ent, idx) => {
            return (
              <tr>
                <th scope="row">
                  <label>{strToVdom(ent.key)}</label>
                </th>
                <td>
                  <textarea name={idx} value={ent.val} class="large-text" oninput={actions.input}></textarea>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p class="submit">
        <button type="button" class="button button-primary" onclick={actions.onSettle}>{_T('Commit Changes')}</button>
        <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
      </p>
    </form>
  )
}

const viewBehavior = (state, actions) => {
  return (
    <form novalidate key="behavior">
      <table class="form-table">
        <tbody>
          <tr>
            <th scope="row">
              <label>{_T('Smooth Scroll')}</label>
              <Message>{_T(state.messages['.smoothScroll'])}</Message>
            </th>
            <td>
              <fieldset>
                <label><input type="radio" name="smoothScroll" value="true" checked={(""+state.form.smoothScroll) == "true"} onchange={actions.change}></input><span>{_T('Do Smooth Scroll')}</span></label>
                <br></br>
                <label><input type="radio" name="smoothScroll" value="false" checked={(""+state.form.smoothScroll) == "false"} onchange={actions.change}></input><span>{_T('Don\'t Smooth Scroll')}</span></label>
              </fieldset>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="submit">
        <button type="button" class="button button-primary" onclick={actions.onSettle}>{_T('Commit Changes')}</button>
        <button type="button" class="button" onclick={actions.onDismiss}>{_T('Discard Changes')}</button>
      </p>
    </form>
  )
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
        <a href="#rule" onclick={actions.activate} class={`nav-tab ${state.tab == 'rule' ? 'nav-tab-active' : ''}`}>{_T('Calculation Rule')}</a>
        <a href="#word" onclick={actions.activate} class={`nav-tab ${state.tab == 'word' ? 'nav-tab-active' : ''}`}>{_T('Words')}</a>
        <a href="#behavior" onclick={actions.activate} class={`nav-tab ${state.tab == 'behavior' ? 'nav-tab-active' : ''}`}>{_T('Behavior')}</a>
      </nav>
      {(state.tab == 'rule') ? viewRule(state.rule, actions.rule) : null}
      {(state.tab == 'word') ? viewWord(state.word, actions.word) : null}
      {(state.tab == 'behavior') ? viewBehavior(state.behavior, actions.behavior) : null}
    </div>
  )
}

const submitUrl = wqData.submitUrl;
const _T = translate(wqData.catalog);
const allActions = app(createInitialState(wqData.rule, wqData.word, wqData.behavior), actions, view, document.getElementById('root'))
const validate = {
  rule: (new Ajv({coerceTypes: true, allErrors: true})).compile(wqData.ruleSchema), 
  word: (new Ajv({coerceTypes: true, allErrors: true})).compile(wqData.wordSchema), 
  behavior: (new Ajv({coerceTypes: true, allErrors: true})).compile(wqData.behaviorSchema)
}