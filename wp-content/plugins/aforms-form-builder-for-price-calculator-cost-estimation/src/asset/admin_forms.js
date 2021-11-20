
import { h, app } from 'hyperapp';
import { translate, lremove, linsert, findIndexByProp } from './admin_common';

const showDate = (ts) => {
  const date = new Date(ts * 1000);
  return date.toLocaleDateString(undefined)
}

const submitDel = (id, url, k) => {
  jQuery.ajax({
    type: "post", 
    url: url, 
    success: function(response) {
      k(id)
    }, 
    dataType: 'json'
  });
}

const submitDup = (id, url, k) => {
  jQuery.ajax({
    type: "post", 
    url: url, 
    success: function(response) {
      k(response)
    }, 
    dataType: 'json'
  });
}

const actions = {
  onDelete: (ev) => (state, actions) => {
    const id = ev.currentTarget.id.split('-')[1]
    if (window.confirm(_T('Do You Want To Remove This Form?'))) {
      submitDel(id, delUrl.replace('placeholder', id), actions.onDeleteK)
      return {...state, loading:true}
    }
  }, 
  onDeleteK: (id) => (state, actions) => {
    const idx = findIndexByProp("id", id, state.forms)
    const forms = lremove(state.forms, idx)
    return {...state, notice:'Form deleted.', loading:false, forms}
  }, 
  onDuplicate: (ev) => (state, actions) => {
    const id = ev.currentTarget.id.split('-')[1]
    submitDup(id, dupUrl.replace('placeholder', id), actions.onDuplicateK)
    return {...state, loading:true}
  }, 
  onDuplicateK: ({form}) => (state, actions) => {
    const forms0 = linsert(state.forms, 0, form)
    forms0.sort((f0, f1) => f1.id - f0.id)  // in-place
    const forms = forms0  // forms0.slice(0, -1)
    return {...state, notice:'Form duplicated.', loading:false, forms}
  }, 
  hideNotice: () => (state, actions) => {
    return {...state, notice:null}
  }
}

const createInitialState = (forms) => {
  return {
    forms, 
    loading: false, 
    notice: null
  }
}

const view = (state, actions) => {
  return (
    <form>
      {(state.notice) ? (
        <div class="updated settings-error notice is-dismissible">
          <p><strong>{_T(state.notice)}</strong></p>
          <button type="button" class="notice-dismiss" onclick={actions.hideNotice}><span class="screen-reader-text">{_T('Dismiss this notice.')}</span></button>
        </div>
      ) : null}
      <table class="wp-list-table widefat fixed striped">
        <thead>
          <tr>
            {/*<th scope="col" id="id" class="manage-column column-id">{_T('ID')}</th>*/}
            <th scope="col" id="title" class="manage-column column-title column-primary">{_T('Title')}</th>
            <th scope="col" id="author" class="manage-column column-author">{_T('Author')}</th>
            <th scope="col" id="date" class="manage-column column-date">{_T('Date')}</th>
          </tr>
        </thead>
        <tbody id="the-list">
          {state.forms.map(form => {
            const thisEditUrl = editUrl.replace('placeholder', form.id)
            const thisPvUrl = pvUrl.replace('placeholder', form.id)
            return (
              <tr id={`form-${form.id}`}>
                {/*<td class="id column-id">
                  {form.id}
            </td>*/}
                <td class="title column-title column-primary">
                  <strong><a class="row-title" href={thisEditUrl}>[{form.id}] {form.title}</a></strong>
                  <div class="row-actions">
                    <span class="edit"><a href={thisEditUrl}>{_T('Edit')}</a> | </span>
                    <span class="duplicate"><a href="javascript:void(0);" onclick={actions.onDuplicate} id={`duplicate-${form.id}`}>{_T('Duplicate')}</a> | </span>
                    <span class="trash"><a href="javascript:void(0);" onclick={actions.onDelete} id={`trash-${form.id}`}>{_T('Trash')}</a> | </span>
                    <span class="my-preview"><a href={thisPvUrl} target="_blank">{_T('Preview')}</a></span>
                  </div>
                </td>
                <td class="author column-author">
                  {form.author ? form.author.name : ''}
                </td>
                <td class="date column-date">
                  <abbr>{showDate(form.modified)}</abbr>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </form>
  )
}

const _T = translate(wqData.catalog);
const editUrl = wqData.editUrl
const delUrl = wqData.delUrl
const dupUrl = wqData.dupUrl
const pvUrl = wqData.pvUrl
const newUrl = wqData.newUrl
const allActions = app(createInitialState(wqData.forms), actions, view, document.getElementById('root'))