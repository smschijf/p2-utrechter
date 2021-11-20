<?php

if ($status != 'SUCCESS') {
    echo __('ERROR: Failed to retrieve the content for the following reason: ', 'aforms') . $status;
    exit;
}

//load_plugin_textdomain('aforms', false, $tpldir);
$output['catalog'] = array(
    'Subtotal' => __('Subtotal', 'aforms'), 
    'Tax' => __('Tax', 'aforms'), 
    'Total' => __('Total', 'aforms'), 
    'Order List' => __('Order List', 'aforms'),  // '注文一覧', 
    'Dismiss this notice.' => __('Dismiss this notice.', 'aforms'), 
    'Summary' => __('Summary', 'aforms'),  // '概要', 
    'Form' => __('Form', 'aforms'),  // 'フォーム', 
    'Customer' => __('Customer', 'aforms'),  // 'お客様', 
    'Close' => __('Close', 'aforms'),  // '閉じる', 
    'Delete' => __('Delete', 'aforms'),  // '削除', 
    'Open' => __('Open', 'aforms'),  // '開く', 
    'guest' => __('guest', 'aforms'),  // 'ゲスト', 
    'There are no orders yet.' => __('There are no orders yet.', 'aforms'),  // '注文はまだありません。'
    'Current Page' => __('Current Page', 'aforms'),  // '現在のページ', 
    'First Page' => __('First Page', 'aforms'),  // '最初のページ', 
    'Prev Page' => __('Prev Page', 'aforms'),  // '前のページ', 
    'Next Page' => __('Next Page', 'aforms'),  // 次のページ
    'Last Page' => __('Last Page', 'aforms'),  // 最後のページ
    'Input a valid page number.' => __('Input a valid page number.', 'aforms'), 
    'Do You Want To Remove This Order?' => __('Do You Want To Remove This Order?', 'aforms'), 
    'Order deleted.' => __('Order deleted.', 'aforms'), 
    ', ' => __(', ', 'aforms'), 
    '(%s%% applied)' => __('(%s%% applied)', 'aforms'),  // +
    'Tax (%s%%)' => __('Tax (%s%%)', 'aforms'),  // +
    '(common %s%% applied)' => __('(common %s%% applied)', 'aforms'),  // +
    'Tax (common %s%%)' => __('Tax (common %s%%)', 'aforms'), 
    '%s items' => __('%s items', 'aforms'), 
    '#%s' => __('#%s', 'aforms')
);
$output['rule'] = $resolve('rule')->load();
$output['pageUrl'] = $urlHelper->ajax('wq-order', array('placeholder'));
$output['delUrl'] = $urlHelper->ajax('wq-order-del', array('del', 'placeholder'));

wp_enqueue_script('order-js', $urlHelper->asset('/asset/admin_orders.js'), array('jquery'), \AFormsWrap::VERSION);
wp_localize_script('order-js', 'wqData', $output);
wp_enqueue_style('admin-css', $urlHelper->asset('/asset/admin.css'), array(), \AFormsWrap::VERSION);

?>
<div class="wrap">
<h1 class="wp-heading-inline"><?= htmlspecialchars($output['catalog']['Order List']) ?></h1>
<hr class="wp-header-end" />
<div id="root"></div>
</div>