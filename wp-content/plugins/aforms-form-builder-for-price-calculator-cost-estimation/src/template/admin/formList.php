<?php

if ($status != 'SUCCESS') {
    echo __('ERROR: Failed to retrieve the content for the following reason: ', 'aforms') . $status;
    exit;
}

//load_plugin_textdomain('aforms', false, $tpldir);
$output['catalog'] = array(
    //'' => __('', 'aforms'), 
    'Form List' => __('Form List', 'aforms'), 
    'Add New' => __('Add New', 'aforms'), 
    'Title' => __('Title', 'aforms'), 
    'Author' => __('Author', 'aforms'), 
    'Date' => __('Date', 'aforms'), 
    'ID' => __('ID', 'aforms'), 
    'Edit' => __('Edit', 'aforms'), 
    'Duplicate' => __('Duplicate', 'aforms'), 
    'Trash' => __('Trash', 'aforms'), 
    'Preview' => __('Preview', 'aforms'), 
    'Do You Want To Remove This Form?' => __('Do You Want To Remove This Form?', 'aforms'), 
    'Form deleted.' => __('Form deleted.', 'aforms'), 
    'Dismiss this notice.' => __('Dismiss this notice.', 'aforms'), 
    'Form duplicated.' => __('Form duplicated.', 'aforms')
);
$output['dupUrl'] = $urlHelper->ajax('wq-form-dup', array('dup', 'placeholder'));
$output['delUrl'] = $urlHelper->ajax('wq-form-del', array('del', 'placeholder'));
$output['editUrl'] = $urlHelper->adminPage('wq-form', array('edit', 'placeholder'));
$output['newUrl'] = $urlHelper->adminPage('wq-form', array('new', '-1'));
$output['pvUrl'] = $urlHelper->adminPage('wq-form', array('preview', 'placeholder'));

wp_enqueue_script('form-js', $urlHelper->asset('/asset/admin_forms.js'), array('jquery'), \AFormsWrap::VERSION);
wp_localize_script('form-js', 'wqData', $output);
wp_enqueue_style('admin-css', $urlHelper->asset('/asset/admin.css'), array(), \AFormsWrap::VERSION);

?>
<div class="wrap">
<h1 class="wp-heading-inline"><?= esc_html($output['catalog']['Form List']) ?></h1>
<a href="<?= $output['newUrl'] ?>" class="page-title-action"><?= esc_html($output['catalog']['Add New']) ?></a>
<hr class="wp-header-end" />
<div class="wq-Row">
  <div class="wq--main">
    <div id="root"></div>
  </div>
  <div class="wq--side">
    <?php $renderer->embed('admin/help') ?>
  </div>
</div>
</div>