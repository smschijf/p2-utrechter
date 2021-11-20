
import { h, app } from 'hyperapp';


const arrMove = (arr, from, to) => {
  const item = arr[from]
  const arr2 = arr.filter((e, i) => i != from)
  //if (from < to) to--
  arr2.splice(to, 0, item)
  console.log('arrMove', arr, from, to, arr2)
  return arr2
}
const arrIns = (arr, idx, e) => {
  return arr.reduce((cur, e0, i) => {
    if (i == idx) {
      return [...cur, e, e0]
    } else {
      return [...cur, e0]
    }
  }, [])
}
const arrRem = (arr, from) => {
  arr = arr.filter((e, i) => i != from)
  return arr
}
const arrRep = (arr, idx, e) => {
  return arr.map((e0, i) => (i == idx) ? e : e0)
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
    onEnd
  }
  return {
    oncreate: (el) => {
      instance = Sortable.create(el, effectiveOptions)
    }, 
    ondestroy: () => {
      instance.destroy()
      instance = null
    }
  }
}
const SortableList = (
    {
      id, 
      group, 
      handle, 
      onSortStart, 
      onSortEnd
    }, children) => {
  const {oncreate, ondestroy} = instantiateSortable({group, handle, onSortStart, onSortEnd})
  return (
    <div class="wq-SortableList" id={id} key={id} oncreate={oncreate} ondestroy={ondestroy}>
      {children}
    </div>
  )
}

const branchNo = (id) => {
  const off = id.lastIndexOf('-')
  return id.slice(off + 1)
}

const initialState = {
  itemss: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]], 
  sorting: null
}
const actions = {
  onOuterSortStart: () => (state, actions) => {
    return {...state, sorting:'outer'}
  }, 
  onOuterSortEnd: ({fromId, fromIndex, toId, toIndex}) => (state, actions) => {
    return {...state, sorting:null, itemss:arrMove(state.itemss, fromIndex, toIndex)}
  }, 
  onSortStart: () => (state, actions) => {
    return {...state, sorting:'inner'}
  }, 
  onSortEnd: ({fromId, fromIndex, toId, toIndex}) => (state, actions) => {
    fromId = branchNo(fromId)
    toId = branchNo(toId)
    console.log('onSortEnd', fromId, fromIndex, toId, toIndex)
    if (fromId != toId) {
      const item = state.itemss[fromId][fromIndex]
      const fromItems = arrRem(state.itemss[fromId], fromIndex)
      const toItems = arrIns(state.itemss[toId], toIndex, item)
      return {...state, sorting:null, itemss:arrRep(arrRep(state.itemss, fromId, fromItems), toId, toItems)}
    } else {
      const items = arrMove(state.itemss[fromId], fromIndex, toIndex)
      return {...state, sorting:null, itemss:arrRep(state.itemss, fromId, items)}
    }
  }
}

const view = (state, actions) => {
  console.log('view', state)
  return (
    <SortableList id={`group-0`} group="outer" onSortStart={actions.onOuterSortStart} onSortEnd={actions.onOuterSortEnd} handle=".ohandle">
      {state.itemss.map((items, idx) => {
        return (
          <div style={{border:"1px solid #666"}}>
            <div style={{display:'flex', opacity:state.sorting=='inner'?0.3:1}} key={`header-${idx}`} id={`header-${idx}`}>
              <div class="ohandle" style={{flex:'0 0 auto'}}>=</div>
              <div class="body" style={{flex:'1 1 auto'}}>X-{idx}</div>
              <div class="trash" style={{flex:'0 0 auto'}} onclick={() => actions.onremove([idx, x])}>x</div>
            </div>
            <SortableList id={`list-${idx}`} group="inner" onSortStart={actions.onSortStart} onSortEnd={actions.onSortEnd} handle=".handle">
              {items.map((i, x) => {
                return (
                  <div style={{display:'flex', opacity:state.sorting=='outer'?0.3:1}} key={`item-${i}`} id={`item-${i}`}>
                    <div class="handle" style={{flex:'0 0 auto'}}>=</div>
                    <div class="body" style={{flex:'1 1 auto'}}>{i}</div>
                    <div class="trash" style={{flex:'0 0 auto'}} onclick={() => actions.onremove([idx, x])}>x</div>
                  </div>
                )
              })}
            </SortableList>
          </div>
        )
      })}
    </SortableList>
  )
}

app(initialState, actions, view, document.getElementById('root'))
