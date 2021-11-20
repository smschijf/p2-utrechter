<?php

if ($status != 'SUCCESS') {
    echo __('ERROR: Failed to retrieve the content for the following reason: ', 'aforms') . $status;
    exit;
}

//load_plugin_textdomain('aforms', false, $tpldir);
$output['catalog'] = array(
    'Form Settings' => __('Form Settings', 'aforms'),  // 'フォーム設定', 
    'Round Down' => __('Round Down', 'aforms'),  // '切り下げ', 
    'Round Up' => __('Round Up', 'aforms'),  // '切り上げ', 
    'Round Off' => __('Round Off', 'aforms'),  // '四捨五入', 
    'Truncate' => __('Truncate', 'aforms'),  // '切り捨て', 
    'should be integer' => __('should be integer', 'aforms'),  // '数値を入力してください', 
    'Settings saved.' => __('Settings saved.', 'aforms'),  // '設定を保存しました', 
    'Dismiss this notice.' => __('Dismiss this notice.', 'aforms'),  // 'この通知を非表示にする', 
    'Fraction Treatment' => __('Fraction Treatment', 'aforms'),  // '端数の取り扱い', 
    'Tax Included' => __('Tax Included', 'aforms'),  // '内税表記', 
    'Tax Excluded' => __('Tax Excluded', 'aforms'),  // '外税表記', 
    'Tax Rate' => __('Tax Rate', 'aforms'),  // '税率', 
    '%' => __('%', 'aforms'),  // '%', 
    'Fraction Processing' => __('Fraction Processing', 'aforms'),  // '端数の処理方法', 
    'Processing Precision' => __('Processing Precision', 'aforms'),  // '端数処理のケタ', 
    'The number of digits left by rounding. If "1" is specified, the processing result will be "12.3".' => __('The number of digits left by rounding. If "1" is specified, the processing result will be "12.3".', 'aforms'),  // '端数処理で残すケタ数です。「1」を指定すると処理結果が「12.3」のようになります。', 
    'Save' => __('Save', 'aforms'),  // '変更を保存', 
    'Tax Notation' => __('Tax Notation', 'aforms'), 
    'Discard Changes' => __('Discard Changes', 'aforms'), 
    'Commit Changes' => __('Commit Changes', 'aforms'), 
    'Changes committed. Be sure to save data before moving to another page.' => __('Changes committed. Be sure to save data before moving to another page.', 'aforms'), 
    'Calculation Rule' => __('Calculation Rule', 'aforms'), 
    'Behavior' => __('Behavior', 'aforms'), 
    'Smooth Scroll' => __('Smooth Scroll', 'aforms'), 
    'Do Smooth Scroll' => __('Do Smooth Scroll', 'aforms'), 
    'Don\'t Smooth Scroll' => __('Don\'t Smooth Scroll', 'aforms'), 
    'Words' => __('Words', 'aforms')
);
$output['submitUrl'] = $urlHelper->ajax('wq-settings-set');

wp_enqueue_script('form-js', $urlHelper->asset('/asset/admin_settings.js'), array('jquery'), \AFormsWrap::VERSION);
wp_localize_script('form-js', 'wqData', $output);
wp_enqueue_style('admin-css', $urlHelper->asset('/asset/admin.css'), array(), \AFormsWrap::VERSION);

?>
<div class="wrap">
  <div class="wq-TitleBar">
    <h1 class="wp-heading-inline"><?= esc_html($output['catalog']['Form Settings']) ?></h1>
    <div class="wq--spacer"></div>
    <button id="save-button" class="button button-primary button-large"><?= esc_html($output['catalog']['Save']) ?></button>
  </div>
  <hr class="wp-header-end" />
  <div class="wq-Row wq-mt-3">
    <div class="wq--main">
      <div id="root"></div>
    </div>
    <div class="wq--side">
      <?php $renderer->embed('admin/help') ?>
    </div>
  </div>
</div>