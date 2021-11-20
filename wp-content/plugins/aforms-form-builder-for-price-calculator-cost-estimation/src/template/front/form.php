<?php

//var_dump($output);exit;
//$output['submitUrl'] = $urlHelper->ajax('wq-settings-set');

if ($status != 'SUCCESS') {
    echo "ERROR:".$status;
    return;
}

$options = $resolve('options');
$form = $output['form'];
$word = $resolve('word')->load();

$output['catalog'] = $options->extendWord($word, $form);
$output['rule'] = $options->extendRule($resolve('rule')->load(), $form);
$output['behavior'] = $options->extendBehavior($resolve('behavior')->load(), $form);
$output['customUrl'] = $urlHelper->ajax('wq-custom', array('placeholder'));
$output['submitUrl'] = $urlHelper->ajax('wq-order-new');
$sidebarSelector = $options->extendSidebarSelector('', $form->id);
$output['sidebarSelector'] = ($sidebarSelector && $output['mode'] == 'preview') ? '#sidebar-for-preview' : $sidebarSelector;

$depends = $options->extendScriptDeps(array('jquery'), $form);
wp_enqueue_script('form-js', $urlHelper->asset('/asset/front.js'), $depends, \AFormsWrap::VERSION, true);
wp_localize_script('form-js', 'wqData', $output);
$options->onLoadScript($form);

// enqueue a style for this form after those of themes.
wp_enqueue_style('dashicons');
$stylesheet = $options->extendStylesheetUrl($urlHelper->asset('/asset/front.css'), $form);
wp_enqueue_style('front-css', $stylesheet, array('dashicons'), \AFormsWrap::VERSION);

?>
<div id="root"></div>

<div class="wq-Dialog" id="wq-dialog">
  <div class="wq--frame">
    <p class="wq--message" id="wq-dialog-message"></p>
    <div class="wq--actions">
        <a class="wq-Button wq-belongs-dialog wq-for-link" id="wq-link-button" href="" target="_blank"></a>
        <button type="button" class="wq-Button wq-belongs-dialog wq-for-ok" id="wq-ok-button"></button>
    </div>
  </div>
</div>
<script>
window.aformsDialog = (function () {
  var opener = document.getElementById('wq-dialog');
  var p = document.getElementById('wq-dialog-message');
  var linkButton = document.getElementById('wq-link-button');
  var okButton = document.getElementById('wq-ok-button');
  var kontinue = null;
  linkButton.addEventListener('click', function () {
    window.setTimeout(function () {hide(true);}, 100);
  });
  okButton.addEventListener('click', function () {
    hide(false);
  });
  function show(message, url, linkText, k, okText) {
    kontinue = k;
    p.innerText = message;
    if (url) {
      linkButton.href = url;
      linkButton.innerText = linkText;
    } else {
      linkButton.style.display = "none";
    }
    okButton.innerText = okText ? okText : '<?= htmlspecialchars($word['OK']) ?>';
    opener.style.display = 'block';
    document.documentElement.classList.add('wq-x-suspended');
    window.setTimeout(function () {
      opener.classList.add('wq-is-shown');
    }, 100);
  }
  function hide(res) {
    var k = kontinue;
    kontinue = null;
    opener.classList.remove('wq-is-shown');
    window.setTimeout(function () {
      document.documentElement.classList.remove('wq-x-suspended');
      opener.style.display = 'none';
      k(res);
    }, 100);
  }
  return show;
})();
</script>
