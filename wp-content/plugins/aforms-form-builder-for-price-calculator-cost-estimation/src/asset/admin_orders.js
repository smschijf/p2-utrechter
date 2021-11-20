
import { h, app } from 'hyperapp';
import number_format from 'locutus/php/strings/number_format';
import { translate, lremove, linsert, findIndexByProp, branchNo, reduceHash, tnOnCreate, tnOnRemove, sprintf, File } from './admin_common';

const go = (page, k) => {
  const url = pageUrl.replace('placeholder', page)
  jQuery.ajax({
    type: "get", 
    url: url, 
    success: function(response) {
      k(response)
    }, 
    dataType: 'json'
  });
}

const submitDel = (id, k) => {
  const url = delUrl.replace('placeholder', id)
  jQuery.ajax({
    type: "post", 
    url: url, 
    success: function(response) {
      k(id)
    }, 
    dataType: 'json'
  });
}

const pageLink = (paging, page, relation, text, mark, onclick) => {
  const enabled = (paging.firstPage <= page && page <= paging.lastPage && 
                   paging.page != page)
  if (enabled) {
    return (
      <a class={`button ${relation}-page`} href="javascript:void(0);" name={`page-${page}`} onclick={onclick}>
        <span class="screen-reader-text">{_T(text)}</span>
        <span aria-hidden="true">{mark}</span>
      </a>
    )
  } else {
    return (
      <span class="tablenav-pages-navspan button disabled" aria-hidden="true">{mark}</span>
    )
  }
}

const Pager = (
    {
      paging, 
      onclick, 
      pageValue, 
      oninput, 
      onkeydown, 
      suffix = ''
    }) => {
  const id = "current-page-selector" + suffix
  return (
    <div class={`tablenav-pages ${paging.lastPage == 1 ? 'one-page' : ''}`}>
      <span class="displaying-num">{sprintf(_T('%s items'), paging.total)}</span>
      <span class="pagination-links">
        {pageLink(paging, 1, 'first', 'First Page', '«', onclick)}
        {pageLink(paging, paging.page - 1, 'prev', 'Prev Page', '‹', onclick)}
        <span class="paging-input">
          <label for={id} class="screen-reader-text">{_T('Current Page')}</label>
          <input class="current-page" id={id} type="text" name="paged" value={pageValue} oninput={oninput} onkeydown={onkeydown} size="1" aria-describedby="table-paging" />
          <span class="tablenav-paging-text"> / <span class="total-pages">{paging.lastPage}</span></span>
        </span>
        {pageLink(paging, paging.page + 1, 'next', 'Next Page', '›', onclick)}
        {pageLink(paging, paging.lastPage, 'last', 'Last Page', '»', onclick)}
      </span>
    </div>
  )
}

const showDate = (ts) => {
  const date = new Date(ts * 1000);
  return date.toLocaleString(undefined)
}

const nf = (currency, amount, withSign) => {
  if (withSign) {
    return currency.pricePrefix + number_format(amount, currency.taxPrecision, currency.decPoint, currency.thousandsSep) + currency.priceSuffix
  }
  return number_format(amount, currency.taxPrecision, currency.decPoint, currency.thousandsSep)
}


const createInitialState = (orders, paging) => {
  return {
    orders, 
    paging, 
    expanded: {}, 
    pageValue1: paging.page, 
    pageValue2: paging.page, 
    loading: false, 
    notice: null
  };
}

const actions = {
  onPaging: (ev) => (state, actions) => {
    const page = branchNo(ev.currentTarget.name, '-')
    go(page, actions.onPagingK)
    return {...state, loading:true}
  }, 
  onPagingK: ({orders, paging}) => (state, actions) => {
    const p = paging.page
    window.requestAnimationFrame(() => {
      if (document.activeElement) {
        document.activeElement.blur()
      }
    })
    return {...state, orders, paging, loading:false, pageValue1:p, pageValue2:p}
  }, 
  onInput1: (ev) => (state, actions) => {
    const pageValue1 = ev.currentTarget.value
    return {...state, pageValue1}
  }, 
  onInput2: (ev) => (state, actions) => {
    const pageValue2 = ev.currentTarget.value
    return {...state, pageValue2}
  }, 
  onKeydown: (ev) => (state, actions) => {
    if (ev.keyCode == 13) {
      const p = parseInt(ev.currentTarget.value)
      if (!isNaN(p) && state.paging.firstPage <= p && p <= state.paging.lastPage) {
        go(p, actions.onPagingK)
        return {...state, loading:true}
      } else {
        window.alert(_T('Input a valid page number.'))
      }
    }
  }, 
  onOpen: (ev) => (state, actions) => {
    const id = branchNo(ev.currentTarget.id, '-')
    const expanded = {...state.expanded, [id]:true}
    return {...state, expanded}
  }, 
  onClose: (ev) => (state, actions) => {
    const id = branchNo(ev.currentTarget.id, '-')
    const expanded = {...state.expanded}
    delete expanded[id]
    return {...state, expanded}
  }, 
  onDelete: (ev) => (state, actions) => {
    if (!window.confirm(_T('Do You Want To Remove This Order?'))) return;
    const id = branchNo(ev.currentTarget.id, '-')
    submitDel(id, actions.onDeleteK)
    return {...state, loading:true}
  }, 
  onDeleteK: (id) => (state, actions) => {
    // このページの注文一覧をリロードする。
    // が、表示している注文が1つの場合、現在のページがなくなるかもしれない。
    const p = (state.orders.length == 1 && state.paging.total != 1) ? state.paging.page - 1 : state.paging.page
    go(p, actions.onPagingK)
    return {...state, notice:'Order deleted.'}
  }, 
  hideNotice: () => (state, actions) => {
    return {...state, notice:null}
  }
}

const viewSummaryLine = (order) => {
  return (
    <strong class="wq-x-summary-line">
      <span class="wq--id">{sprintf(_T('#%s'), order.id)}</span>
      <span class="wq--date">{showDate(order.created)}</span>
      {(order.total > 0) ? (
        <span class="wq--badge wq-type-primary">{nf(order.currency, order.total, true)}</span>
      ) : null}
      {(order.condition.softPass) ? (
        <span class="wq--badge wq-type-warning">Soft-Pass</span>
      ) : null}
    </strong>
  )
}

const showLines = (value) => {
  const text = (value === null) ? '' : value
  return text.split(/\r?\n/).reduce((result, line) => {
    result.push(line)
    result.push(<br></br>)
    return result
  }, [])
}
const showAttrValue = (value) => {
  if (Array.isArray(value)) {
    if (value.length > 0 && value[0] !== null && typeof value[0] == 'object') {
      // external list
      return (
        <div class="wq-Group">
          {value.map((ext) => {
            return (
              <a href={ext.url} target="_blank">
                <File url={ext.url} name={ext.name} />
              </a>
            )
          })}
        </div>
      )
    } else {
      // string list
      return showLines(value.join(_T(', ')))
    }
  } else {
    if (value !== null && typeof value == 'object') {
      // external
      return (
        <a href={value.url} target="_blank">
          <File url={value.url} name={value.name} />
        </a>
      )
    } else {
      // string
      return showLines(value)
    }
  }
}

const viewDetail = (order) => {
  var x = null;
  return (
    <div class="wq-Order">
      <div class="wq--detail">
        <div class="wq--heading wq-for-form">{order.formTitle}</div>
        <table class="wq--detailTable">
          <tbody>
            {order.details.map((detail, i) => {
              return (
                <tr>
                  <td class="wq-for-category">{detail.category}</td>
                  <td class="wq-for-name">{detail.name}</td>
                  <td class="wq-for-unitPrice">{nf(order.currency, detail.unitPrice, false)}</td>
                  <td class="wq-for-quantity">{detail.quantity}</td>
                  {order.hasOwnProperty('taxes') && (<td class="wq-for-taxInfo">{detail.taxRate === null ? sprintf(_T('(common %s%% applied)'), order.defaultTaxRate) : sprintf(_T('(%s%% applied)'), detail.taxRate)}</td>)}
                  <td class="wq-for-price">{nf(order.currency, detail.price, false)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(order.details.length > 0 || order.total != 0) ? (
          <table class="wq--summaryTable">
              <tbody>
                {order.hasOwnProperty('subtotal') ? (
                  <tr class="wq-for-subtotal">
                    <th scope="row">{_T('Subtotal')}</th>
                    <td>{nf(order.currency, order.subtotal, true)}</td>
                  </tr>
                ) : null}
                {order.hasOwnProperty('taxes') && order.taxes[''] > 0 ? (
                  <tr class="wq-for-tax">
                    <th scope="row">{sprintf(_T('Tax (common %s%%)'), order.defaultTaxRate)}</th>
                    <td>{nf(order.currency, order.taxes[''], true)}</td>
                  </tr>
                ) : null}
                {order.hasOwnProperty('taxes') ? (
                  reduceHash((cur, key, tax) => {
                    if (key === "") return cur
                    return [...cur, (
                      <tr class="wq-for-tax">
                        <th scope="row">{sprintf(_T('Tax (%s%%)'), key)}</th>
                        <td>{nf(order.currency, tax, true)}</td>
                      </tr>
                    )]
                  }, [], order.taxes)
                ) : null}
                <tr class="wq-for-total">
                  <th scope="row">{_T('Total')}</th>
                  <td>{nf(order.currency, order.total, true)}</td>
                </tr>
              </tbody>
          </table>
        ) : null}
      </div>
      <div class="wq--customer">
        <div class="wq--heading wq-for-customer">{order.customer ? order.customer.name : _T('guest')}</div>
        <table class="form-table">
          <tbody>
            {order.attrs.map((attr, i) => {
              return (
                <tr>
                  <th scope="row">{attr.name}</th>
                  <td>{showAttrValue(attr.value)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const view = (state, actions) => {
  return (
    <div>
      {(state.notice) ? (
        <div class="updated settings-error notice is-dismissible">
          <p><strong>{_T(state.notice)}</strong></p>
          <button type="button" class="notice-dismiss" onclick={actions.hideNotice}><span class="screen-reader-text">{_T('Dismiss this notice.')}</span></button>
        </div>
      ) : null}
      {state.orders.length > 0 ? (
        <form>
          <div class="tablenav top">
            <Pager paging={state.paging} onclick={actions.onPaging} pageValue={state.pageValue1} oninput={actions.onInput1} onkeydown={actions.onKeydown} />
          </div>
          <table class="wp-list-table widefat fixed striped">
            <thead>
              <tr>
                <th scope="col" id="summary" class="manage-column column-summary column-primary">{_T('Summary')}</th>
                <th scope="col" id="form" class="manage-column column-form">{_T('Form')}</th>
                <th scope="col" id="customer" class="manage-column column-customer">{_T('Customer')}</th>
              </tr>
            </thead>
            <tbody id="the-list">
              {state.orders.map((o, i) => {
                const exports = o.exports || []
                if (state.expanded.hasOwnProperty(o.id)) {
                  return (
                    <tr id={`order-${o.id}`} class="wq-list-row wq-is-open">
                      <td colspan="3">
                        <a class="row-title" href="javascript:void(0);" id={`summary-${o.id}`} onclick={actions.onClose}>{viewSummaryLine(o)}</a>
                        {viewDetail(o)}
                        <div>
                          {exports.map(x => {
                            return (
                              <a class="button" href={x.url}>{x.name}</a>
                            )
                          })}
                          <button type="button" class="button" id={`detail-close-${o.id}`} onclick={actions.onClose} style={exports.length > 0 ? "margin-left:10px;" : ""}>{_T('Close')}</button>
                          <button type="button" class="button wq-x-danger" id={`detail-delete-${o.id}`} onclick={actions.onDelete}>{_T('Delete')}</button>
                        </div>
                      </td>
                    </tr>
                  )
                } else {
                  return (
                    <tr id={`order-${o.id}`} class="wq-list-row">
                      <td class="summary column-summary column-primary">
                        <a class="row-title" href="javascript:void(0);" id={`summary-${o.id}`} onclick={actions.onOpen}>{viewSummaryLine(o)}</a>
                        <div class="row-actions">
                          {exports.map(x => {
                            return (
                              <span class="export"><a href={x.url}>{x.name}</a> | </span>
                            )
                          })}
                          <span class="open"><a href="javascript:void(0);" id={`action-open-${o.id}`} onclick={actions.onOpen}>{_T('Open')}</a> | </span>
                          <span class="trash"><a href="javascript:void(0);" id={`action-trash-${o.id}`} onclick={actions.onDelete} id={`trash-${o.id}`}>{_T('Delete')}</a></span>
                        </div>
                      </td>
                      <td class="form column-form">
                        {o.formTitle}
                      </td>
                      <td class="form column-customer">
                        {o.customer ? o.customer.name : _T('guest')}
                      </td>
                    </tr>
                  )
                }
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="col" class="manage-column column-summary column-primary">{_T('Summary')}</th>
                <th scope="col" class="manage-column column-form">{_T('Form')}</th>
                <th scope="col" class="manage-column column-customer column-primary">{_T('Customer')}</th>
              </tr>
            </tfoot>
          </table>
          <div class="tablenav bottom">
            <Pager paging={state.paging} onclick={actions.onPaging} pageValue={state.pageValue2} oninput={actions.onInput2} onkeydown={actions.onKeydown} suffix="-2" />
          </div>
          <br class="clear" />
        </form>
      ) : (
        <p>{_T('There are no orders yet.')}</p>
      )}
    </div>
  )
}

const _T = translate(wqData.catalog);
const pageUrl = wqData.pageUrl
const delUrl = wqData.delUrl
const allActions = app(createInitialState(wqData.orders, wqData.paging), actions, view, document.getElementById('root'))
