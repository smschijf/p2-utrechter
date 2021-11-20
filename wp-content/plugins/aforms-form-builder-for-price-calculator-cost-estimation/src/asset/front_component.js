import { h } from 'hyperapp';


export const tnOnCreate = (el) => {
  el.classList.add('wq-is-created')
  el.classList.add('wq-is-run')
  el.classList.add('wq-for-created')
  window.setTimeout(() => {
    el.classList.remove('wq-is-created')
    const h =  (ev) => {
      if (ev.target !== el) return;
      el.classList.remove('wq-is-run')
      el.classList.remove('wq-for-created')
      el.removeEventListener('transitionend', h)
    }
    el.addEventListener('transitionend', h)
    window.setTimeout(() => {
      el.classList.remove('wq-is-run')
      el.classList.remove('wq-for-created')
      el.removeEventListener('transitionend', h)
    }, 800)
  }, 100)
}

export const tnOnRemove = (el, done) => {
  el.classList.add('wq-is-run')
  el.classList.add('wq-for-removed')
  window.setTimeout(() => {
    var doneCalled = false
    el.classList.add('wq-is-removed')
    el.addEventListener('transitionend', (ev) => {
      if (ev.target !== el) return;
      el.classList.remove('wq-is-run')
      el.classList.remove('wq-for-removed')
      if (! doneCalled) {
        done()
        doneCalled = true
      }
    })
    window.setTimeout(() => {
      el.classList.remove('wq-is-run')
      el.classList.remove('wq-for-removed')
      if (! doneCalled) {
        done()
        doneCalled = true
      }
    }, 800)
  }, 100)
}



export const Image = (
    {
      src, 
      scaling = 'center', 
      alt = '', 
      xclass = ''
    }) => {
  const style = {backgroundImage: "url("+src+")"}
  return (
    <div class={`wq-Image wq-scaling-${scaling} ${xclass} ${src ? '' : 'wq-src-empty'}`} style={style} title={alt}>
      <img src={src} alt={alt} class="wq--img" />
    </div> 
  )
}

export const TextInput = (
    {
      type, 
      size,  // full(100%), nano(3em), mini(4em), small(7em), normal(11em)
      name, 
      placeholder, 
      value, 
      invalid = false, 
      oninput, 
      onblur, 
      xclass = ''
    }) => {
  const isInvalid = (invalid) ? 'wq-is-invalid' : ''
  const id = `wq-text-${name}`
  return (
    <input type={type} class={`wq-TextInput wq-size-${size} ${isInvalid} ${xclass}`} id={id} name={name} placeholder={placeholder} value={value} oninput={oninput} onblur={onblur} />
  )
}

export const TextArea = (
    {
      name, 
      placeholder, 
      value, 
      size = 'normal',  // full, normal, small, mini, nano
      invalid = false, 
      oninput, 
      onblur, 
      xclass = ''
    }) => {
  const isInvalid = (invalid) ? 'wq-is-invalid' : ''
  const id = `wq-textarea-${name}`
  return (
    <textarea class={`wq-TextArea ${isInvalid} wq-size-${size} ${xclass}`} id={id} name={name} placeholder={placeholder} value={value} oninput={oninput} onblur={onblur} />
  )
}

export const RadioButton = (
    {
      index, 
      name, 
      value, 
      checked, 
      invalid = false, 
      onchange, 
      xclass = '', 
      inputXclass = ''
    }, children) => {
  const id = `wq-radio-${name}-${index}`
  const isInvalid = (invalid) ? 'wq-is-invalid' : ''
  return (
    <div class={`wq-Radio ${xclass}`} id={id+'-wrapper'}>
      <input type="radio" name={name} value={value} checked={checked} onchange={onchange} id={id} class={`${isInvalid} ${inputXclass}`} />
      <label for={id}>{children}</label>
    </div>
  )
}

export const Checkbox = (
    {
      name, 
      value, 
      checked, 
      invalid = false, 
      onchange, 
      xclass = '', 
      id = null, 
      inputXclass = ''
    }, children) => {
  if (id === null) id = `wq-checkbox-${name}`
  const isInvalid = (invalid) ? 'wq-is-invalid' : ''
  return (
    <div class={`wq-Checkbox ${xclass}`} id={id+'-wrapper'}>
      <input type="checkbox" name={name} value={value} checked={checked} onchange={onchange} id={id} class={`${isInvalid} ${inputXclass}`} />
      <label for={id}>{children}</label>
    </div>
  )
}

export const Select = (
    {
      name, 
      options, 
      value, 
      invalid = false, 
      onchange, 
      placeholder, 
      xclass = '', 
      inputXclass = ''
    }) => {
  const id = `wq-select-${name}`
  const isInvalid = (invalid) ? 'wq-is-invalid' : ''
  placeholder = placeholder || ""
  return (
    <div class={`wq-Select ${xclass}`} id={id+'-wrapper'}>
      <select class="wq--input" name={name} onchange={onchange} id={id} class={`wq--input ${isInvalid} ${inputXclass}`}>
        <option value="" disabled selected={!value}>{placeholder}</option>
        {options.map(o => (
          <option value={o} selected={o == value}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export const Range = (
    {
      name, 
      min, 
      max, 
      step, 
      value, 
      invalid = false, 
      oninput, 
      onchange, 
      xclass = '', 
      suffix = '', 
      inputXclass = ''
    }) => {
  const id = `wq-range-${name}-wrapper`
  const isInvalid = (invalid) ? 'wq-is-invalid' : ''
  const steps = (max - min + 1) / step
  const size = (steps <= 2) ? 'nano'
             : (steps <= 4) ? 'mini'
             : (steps <= 6) ? 'small'
             : (steps <= 10) ? 'medium' 
             : (steps <= 16) ? 'large'
             : 'xlarge' 
  return (
    <div class={`wq-Range ${isInvalid} wq-size-${size} ${xclass}`} id={id}>
      <span class="wq--label wq-for-min">{min}</span>
      <input type="range" class={`wq--input ${inputXclass}`} name={name} id={name} value={value} min={min} max={max} step={step} oninput={oninput} onchange={onchange} />
      <span class="wq--label wq-for-max">{max}</span>
      <span class="wq--state">{value}<span class="wq--state-suffix">{suffix}</span></span>
    </div>
  )
}

export const FileInput = (
    {
      name, 
      extensions, 
      onchange, 
      multiple, 
      invalid = false, 
      inputProps = {}, 
      xclass = "", 
      inputXclass = "", 
      ...props
    }, children) => {
  const accept = extensions.split(',').map(s => '.' + s.trim()).join(',')
  const inputId = 'wq-file-' + name
  return (
    <div class={`wq-FileInput ${invalid ? 'wq-is-invalid' : ''} ${xclass}`} {...props}>
      <input type="file" id={inputId} class={`wq--input ${inputXclass}`} onchange={onchange} accept={accept} {...inputProps} multiple={multiple} />
      <label class="wq--label" for={inputId}><span class="wq--text">{children}</span></label>
    </div>
  )
}

const isViewable = (name) => {
  const i = name.lastIndexOf('.')
  const ext = name.slice(i + 1).trim().toLowerCase()
  return (" jpeg jpg gif png ".indexOf(ext) != -1)
}
export const File = (
    {
      url, 
      name, 
      loading, 
      ondelete, 
      deleteText, 
      index, 
      readonly = false, 
      ...props
    }
) => {
  const viewable = url && isViewable(name)
  return (
    <div class={`wq-File wq-lct-enabled ${loading ? 'wq-is-loading' : ''} ${viewable ? 'wq-is-viewable' : ''} ${readonly ? 'wq-is-readonly' : ''}`} oncreate={tnOnCreate} onremove={tnOnRemove} {...props}>
      {viewable ? (
        <Image src={url} alt={name} scaling="cover" xclass="wq-belongs-file" title={name} />
      ) : null}
      <div class="wq--filename" title={name}>{name}</div>
      {!readonly ? (
        <div class="wq--actions">
          <Button onclick={ondelete} xclass="wq-belongs-file wq-for-delete" data-index={index}></Button>
        </div>
      ) : null}
    </div>
  )
}

export const Echo = (
    {
      name, 
      value, 
      glue, 
      xclass = ''
    }) => {
  const id = `wq-echo-${name}`
  value = (Array.isArray(value)) ? value.join(glue) 
        : (value === null) ? ''
        : value
  const lines = value.split(/\r?\n/).reduce((result, line) => {
    result.push(line)
    result.push(<br></br>)
    return result
  }, [])
  return (
    <div class={`wq-Echo ${xclass}`} id={id}>{lines}</div>
  )
}

export const Button = (
    {
      type = 'normal',  // normal, primary
      disabled = false, 
      xclass = '', 
      onclick, 
      name = null, 
      ...props
    }, children) => {
  return (
    <button type="button" name={name} class={`wq-Button wq-type-${type} ${xclass}`} disabled={disabled} onclick={onclick} {...props}>{children}</button>
  )
}

export const InputGroup = (
    {
      gutter = 'none',  // none, small, mini
      xclass = '', 
    }, children) => {
  return (
    <div class={`wq-InputGroup wq-gutter-${gutter} ${xclass}`}>{children}</div>
  )
}

export const Control = (
    {
      label, 
      required, 
      message, 
      note, 
      requiredText, 
      xclass = '', 
      id = null, 
      key = null
    }, input) => {
  return (
    <div class={`wq-Control wq-lct-enabled ${xclass}`} id={id} oncreate={tnOnCreate} onremove={tnOnRemove} key={key}>
      <div class={`wq--header ${label ? '' : 'wq-content-empty'}`}>
        <span class="wq--label">{label}</span>
        <span class={`wq--required ${!required ? 'wq-is-optional' : ''}`}>{requiredText}</span>
      </div>
      <div class="wq--body">
        {input}
        {(note) ? (<div class="wq--note">{note}</div>) : null}
        {(message) ? (<div class="wq--message wq-lct-enabled" oncreate={tnOnCreate} onremove={tnOnRemove}>{message}</div>) : null}
      </div>
    </div>
  )
}
