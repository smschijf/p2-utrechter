<?php

if ($status != 'SUCCESS') {
    echo __('ERROR: Failed to retrieve the content for the following reason: ', 'aforms') . $status;
    exit;
}

$word = $resolve('word')->load();

//load_plugin_textdomain('aforms', false, $tpldir);
$catalog = array(
    'Select Image' => __('Select Image', 'aforms'), 
    'OK' => __('OK', 'aforms'), 
    'Open Media' => __('Open Media', 'aforms'), 
    'Clear' => __('Clear', 'aforms'), 
    'Title' => __('Title', 'aforms'), 
    'The name for you to distinguish the form. The end-users don\'t see this.' => __('The name for you to distinguish the form. The end-users don\'t see this.', 'aforms'),  // 運営者がフォームを区別するための名前です。お客様には表示されません。
    'Shortcode' => __('Shortcode', 'aforms'), 
    'Embed the shortcode above in a post or a page to display this.' => __('Embed the shortcode above in a post or a page to display this.', 'aforms'),  // 上記のショートコードを記事や固定ページに埋め込むと、そのページにこのフォームが表示されます。
    'Commit Changes' => __('Commit Changes', 'aforms'),  // 変更を確定
    'Discard Changes' => __('Discard Changes', 'aforms'),  // 変更を破棄
    'New Auto Item' => __('New Auto Item', 'aforms'),  // 新しい自動項目
    'New Selector Item' => __('New Selector Item', 'aforms'),  // 新しい選択項目
    'New Option' => __('New Option', 'aforms'),  // 新しい選択肢
    'Auto Item' => __('Auto Item', 'aforms'),  // 自動項目
    'Selector Item' => __('Selector Item', 'aforms'),  // 選択項目
    'Option' => __('Option', 'aforms'),  // 選択肢
    'Duplicate' => __('Duplicate', 'aforms'),  // 複製
    'Delete' => __('Delete', 'aforms'),  // 削除
    'Close Nav' => __('Close Nav', 'aforms'),  // ナビを閉じる
    'Open Nav' => __('Open Nav', 'aforms'),  // ナビを開く
    'Name' => __('Name', 'aforms'), 
    'Category' => __('Category', 'aforms'), 
    'Input here if you want to display a category name in a order detail.' => __('Input here if you want to display a category name in a order detail.', 'aforms'),  // 明細にカテゴリーを表記したい場合は入力してください。
    'Price' => __('Price', 'aforms'), 
    'Labels' => __('Labels', 'aforms'),  // ラベル
    'Required Labels' => __('Required Labels', 'aforms'),  // 必要ラベル
    'Image' => __('Image', 'aforms'),  // 画像
    'Note' => __('Note', 'aforms'),  // 注意書き
    'You can write in HTML.' => __('You can write in HTML.', 'aforms'),  // HTMLで記述できます。
    'Multiple Selection' => __('Multiple Selection', 'aforms'),  // 複数選択
    'Allow' => __('Allow', 'aforms'),  // 可
    'Disallow' => __('Disallow', 'aforms'),  // 不可
    'Regular Price' => __('Regular Price', 'aforms'),  // 通常価格
    'Price' => __('Price', 'aforms'), 
    'You can display the manufacturer\'s desired price.' => __('You can display the manufacturer\'s desired price.', 'aforms'),  // メーカー希望価格などを表示できます。
    'New Input Field' => __('New Input Field', 'aforms'),  // 新しい入力欄
    'Additional Menu' => __('Additional Menu', 'aforms'),  // 追加メニュー
    'Phone Number' => __('Phone Number', 'aforms'), 
    'Mail Address' => __('Mail Address', 'aforms'), 
    'Address' => __('Address', 'aforms'), 
    'Checkbox' => __('Checkbox', 'aforms'), 
    'Radio Button' => __('Radio Button', 'aforms'), 
    'Text' => __('Text', 'aforms'), 
    'Input Required' => __('Input Required', 'aforms'), 
    'Required' => __('Required', 'aforms'),  // 必須
    'Optional' => __('Optional', 'aforms'),  // 自由
    'Split Input Field' => __('Split Input Field', 'aforms'),  // 入力欄の分割
    'Split' => __('Split', 'aforms'),  // 分割する
    'Don\'t Split' => __('Don\'t Split', 'aforms'),  // 分割しない
    'Confirmation Input' => __('Confirmation Input', 'aforms'),  // 確認入力
    'Whether to have email address entered twice for confirmation.' => __('Whether to have email address entered twice for confirmation.', 'aforms'),  // 確認のためメールアドレスを二度入力してもらうかどうか。
    'Confirm' => __('Confirm', 'aforms'),  // 確認を行う
    'Don\'t Confirm' => __('Don\'t Confirm', 'aforms'),  // 確認を行わない
    'Options' => __('Options', 'aforms'),  // 選択肢
    'Separate them with ",".' => __('Separate them with ",".', 'aforms'),  // 「,」で区切ってください。
    'Number of Lines' => __('Number of Lines', 'aforms'),  // 行数
    'Multiple Lines' => __('Multiple Lines', 'aforms'),  // 複数行
    '1 Line' => __('1 Line', 'aforms'),  
    'Width of Input Field' => __('Width of Input Field', 'aforms'), 
    'Nano' => __('Nano', 'aforms'), 
    'Mini' => __('Mini', 'aforms'), 
    'Small' => __('Small', 'aforms'), 
    'Regular' => __('Regular', 'aforms'), 
    'Full' => __('Full', 'aforms'), 
    'Up to 3 characters.' => __('Up to 3 characters.', 'aforms'), 
    'Up to 5 characters.' => __('Up to 5 characters.', 'aforms'), 
    'Up to 8 characters.' => __('Up to 8 characters.', 'aforms'), 
    'Up to 13 characters.' => __('Up to 13 characters.', 'aforms'), 
    'Full width' => __('Full width', 'aforms'), 
    'Subject' => __('Subject', 'aforms'), 
    'From Address' => __('From Address', 'aforms'), 
    'From Name' => __('From Name', 'aforms'), 
    'Notify To' => __('Notify To', 'aforms'),  // 通知先アドレス
    'You can also send a copy of the thank-you-mail to another address.' => __('You can also send a copy of the thank-you-mail to another address.', 'aforms'),  // サンキューメールのコピーを別のアドレスに送ることもできます。
    'Text Body' => __('Text Body', 'aforms'), 
    'HTML Body' => __('HTML Body', 'aforms'), 
    'Leave here blank if you don\'t want to send email in HTML format.' => __('Leave here blank if you don\'t want to send email in HTML format.', 'aforms'),  // メールをHTML形式で送らない場合は空欄のままで構いません。
    'Save' => __('Save', 'aforms'), 
    'Form Details' => __('Form Details', 'aforms'),  // フォーム詳細
    'Form saved.' => __('Form saved.', 'aforms'),  // フォームを保存しました。
    'Dismiss this notice.' => __('Dismiss this notice.', 'aforms'), 
    'General' => __('General', 'aforms'),  
    'Details' => __('Details', 'aforms'), 
    'Attributes' => __('Attributes', 'aforms'), 
    'Mail' => __('Mail', 'aforms'), 
    'should NOT be shorter than 1 characters' => __('should NOT be shorter than 1 characters', 'aforms'), 
    'Changes committed. Be sure to save data before moving to another page.' => __('Changes committed. Be sure to save data before moving to another page.', 'aforms'), 
    'should match pattern' => __('should match pattern', 'aforms'), 
    'should be number' => __('should match pattern', 'aforms'), 
    'Preview' => __('Preview', 'aforms'), 
    'Display Confirmation Screen' => __('Display Confirmation Screen', 'aforms'), 
    'Display' => __('Display', 'aforms'), 
    'Don\'t Display' => __('Don\'t Display', 'aforms'), 
    'Type' => __('Type', 'aforms'), 
    'should match format "uri"' => __('should match format "uri"', 'aforms'), 
    'Thanks Url' => __('Thanks Url', 'aforms'), 
    'If you want to display another page after submitting the form, enter the URL.' => __('If you want to display another page after submitting the form, enter the URL.', 'aforms', 'aforms'), 
    'Navigator' => __('Navigator', 'aforms'), 
    'Flow format' => __('Flow format', 'aforms'), 
    'Wizard format' => __('Wizard format', 'aforms'), 
    'Price Checker' => __('Price Checker', 'aforms'), 
    'Equation' => __('Equation', 'aforms'), 
    'Threshold' => __('Threshold', 'aforms'), 
    'Equal' => __('Equal', 'aforms'), 
    'Not Equal' => __('Not Equal', 'aforms'), 
    'Greater Than' => __('Greater Than', 'aforms'), 
    'Greater Equal' => __('Greater Equal', 'aforms'), 
    'Less Than' => __('Less Than', 'aforms'), 
    'Less Equal' => __('Less Equal', 'aforms'), 
    'Adds a fixed detail line.' => __('Adds a fixed detail line.', 'aforms'), 
    'Monitors the estimated price and gives labels if condition is met.' => __('Monitors the estimated price and gives labels if condition is met.', 'aforms'), 
    'Creates a group of choices.' => __('Creates a group of choices.', 'aforms'), 
    'Adds a detail line if selected.' => __('Adds a detail line if selected.', 'aforms'), 
    'You can insert the following data into the text body.' => __('You can insert the following data into the text body.', 'aforms'), 
    'Order id' => __('Order id', 'aforms'), 
    'Detail lines' => __('Detail lines', 'aforms'), 
    'Total; In case of tax-excluded notation, subtotal and tax are included.' => __('Total; In case of tax-excluded notation, subtotal and tax are included.', 'aforms'), 
    'Customer attributes' => __('Customer attributes', 'aforms'), 
    'Customer name; Available only when using Name control.' => __('Customer name; Available only when using Name control.', 'aforms'), 
    'Customer mail address; Available only when using MailAddress control.' => __('Customer mail address; Available only when using MailAddress control.', 'aforms'), 
    'Separete with ",". This item is availble only if all labels listed are satisfied.' => __('Separete with ",". This item is availble only if all labels listed are satisfied.', 'aforms'), 
    'Separate with ",". If the conditions are met, all the labels listed will be awarded.' => __('Separate with ",". If the conditions are met, all the labels listed will be awarded.', 'aforms'), 
    'Separate with ",". If this option is selected, all the labels listed will be awarded.' => __('Separate with ",". If this option is selected, all the labels listed will be awarded.', 'aforms'), 
    'New Quantity Item' => __('New Quantity Item', 'aforms'), 
    'Quantity Item' => __('Quantity Item', 'aforms'), 
    'Fixed To 1' => __('Fixed To 1', 'aforms'), 
    'Allows Fraction' => __('Allows Fraction', 'aforms'), 
    'Input if you want to add a unit to the input field.' => __('Input if you want to add a unit to the input field.', 'aforms'), 
    'Minimum Value' => __('Minimum Value', 'aforms'), 
    'Maximum Value' => __('Maximum Value', 'aforms'), 
    'Prompts to enter the quantity by hand.' => __('Prompts to enter the quantity by hand.', 'aforms'), 
    'Initial Value' => __('Initial Value', 'aforms'), 
    'Unit' => __('Unit', 'aforms'), 
    'Can be empty.' => __('Can be empty.', 'aforms'), 
    'Quantity' => __('Quantity', 'aforms'), 
    'Off' => __('Off', 'aforms'), 
    'On' => __('On', 'aforms'), 
    'Dropdown' => __('Dropdown', 'aforms'), 
    'Site Key' => __('Site Key', 'aforms'), 
    'Secret Key' => __('Secret Key', 'aforms'), 
    'Action' => __('Action', 'aforms'), 
    'Soft-Pass Score' => __('Soft-Pass Score', 'aforms'), 
    "If the score is lower than this value, AForms considers that the submission is somewhat unreliable and email notifications to administrators will be omitted." => __("If the score is lower than this value, AForms considers that the submission is somewhat unreliable and email notifications to administrators will be omitted.", 'aforms'),  // 信頼性がやや低いとみなされ、運営者への通知メールが省略されます。
    'Failure Score' => __('Failure Score', 'aforms'), 
    "If the score is lower than this value, AForms blocks the submission and show an error to customer." => __("If the score is lower than this value, AForms blocks the submission and show an error to customer.", 'aforms'), 
    "A string that identifies the user's action. Refer: " => __("A string that identifies the user's action. Refer: ", 'aforms'), 
    'Auto Completion' => __('Auto Completion', 'aforms'), 
    'Choose a service to auto-complete address from zip code.' => __('Choose a service to auto-complete address from zip code.', 'aforms'), 
    'None' => __('None', 'aforms'), 
    'Yubinbango (Japan)' => __('Yubinbango (Japan)', 'aforms'), 
    'Input Restriction' => __('Input Restriction', 'aforms'), 
    'Japanese Hiragana' => __('Japanese Hiragana', 'aforms'), 
    'Japanese Katakana' => __('Japanese Katakana', 'aforms'), 
    'Price Checker (OBSOLETED)' => __('Price Checker (OBSOLETED)', 'aforms'), 
    'Monitors the estimated price and gives labels if condition is met. This item is OBSOLETED and deleted in the near future.' => __('Monitors the estimated price and gives labels if condition is met. This item is OBSOLETED and deleted in the near future.', 'aforms'), 
    'Price Watcher' => __('Price Watcher', 'aforms'), 
    'Lower Limit Value' => __('Lower Limit Value', 'aforms'), 
    'Leave this blank if there are no lower limit.' => __('Leave this blank if there are no lower limit.', 'aforms'), 
    'Includes Lower Limit Value' => __('Includes Lower Limit Value', 'aforms'), 
    'Include' => __('Include', 'aforms'), 
    'Don\'t Include' => __('Don\'t Include', 'aforms'), 
    'Includes Higher Limit Value' => __('Includes Higher Limit Value', 'aforms'), 
    'Higher Limit Value' => __('Higher Limit Value', 'aforms'), 
    'Leave this blank if there are no higher limit.' => __('Leave this blank if there are no higher limit.', 'aforms'), 
    'Monitors the estimated price and gives labels if the price is included in a spacified range.' => __('Monitors the estimated price and gives labels if the price is included in a spacified range.', 'aforms'), 
    'Multiple Checkbox' => __('Multiple Checkbox', 'aforms'), 
    'reCAPTCHA v3' => __('reCAPTCHA v3', 'aforms'), 
    'Ribbons' => __('Ribbons', 'aforms'), 
    'SALE' => __('SALE', 'aforms'), 
    'RECOMMENDED' => __('RECOMMENDED', 'aforms'), 
    'Slider Item' => __('Slider Item', 'aforms'), 
    'Prompts to enter the quantity with slider.' => __('Prompts to enter the quantity with slider.', 'aforms'), 
    'Step Value' => __('Step Value', 'aforms'), 
    'New Slider Item' => __('New Slider Item', 'aforms'), 
    'Tax Rate' => __('Tax Rate', 'aforms'), 
    'The tax rate on common settings will be applied when you leave it blank.' => __('The tax rate on common settings will be applied when you leave it blank.', 'aforms'), 
    '%' => __('%', 'aforms'), 
    'should be >= 0' => __('should be >= 0', 'aforms'), 
    '%s\'s Copy' => __('%s\'s Copy', 'aforms'), 
    'If you leave this blank, no detail line will be added, even if it is selected.' => __('If you leave this blank, no detail line will be added, even if it is selected.', 'aforms'), 
    'Extensions' => __('Extensions', 'aforms'), 
    'Available Extensions' => __('Available Extensions', 'aforms'), 
    'Check the extensions to use in this form.' => __('Check the extensions to use in this form.', 'aforms'), 
    'If Site Key or Secret Key is blank, this item has no effect.' => __('If Site Key or Secret Key is blank, this item has no effect.', 'aforms'), 
    'Monitoring Target' => __('Monitoring Target', 'aforms'), 
    'No Target' => __('No Target', 'aforms'), 
    'Monitors the specified quanaity and gives labels if the quantity is included in a specified range.' => __('Monitors the specified quanaity and gives labels if the quantity is included in a specified range.', 'aforms'), 
    'Quantity Watcher' => __('Quantity Watcher', 'aforms'), 
    'Option with Quantity' => __('Option with Quantity', 'aforms'), 
    'If quantity is set, adds a detail line.' => __('If quantity is set, adds a detail line.', 'aforms'), 
    'New Option with Quantity' => __('New Option with Quantity', 'aforms'), 
    'unexpected character around: %s' => __('unexpected character around: %s', 'aforms'), 
    '%s: end of expression' => __('%s: end of expression', 'aforms'), 
    '%s: %s at %s' => __('%s: %s at %s', 'aforms'), 
    'undefined function' => __('undefined function', 'aforms'), 
    'unexpected token' => __('unexpected token', 'aforms'), 
    'too few arguments for' => __('too few arguments for', 'aforms'), 
    'too many arguments for' => __('too many arguments for', 'aforms'), 
    'unexpected operator' => __('unexpected operator', 'aforms'), 
    'unexpected eoe token' => __('unexpected eoe token', 'aforms'), 
    'Total' => __('Total', 'aforms'), 
    'Auto Quantity Item' => __('Auto Quantity Item', 'aforms'), 
    'Generates a quantity value.' => __('Generates a quantity value.', 'aforms'), 
    'Adjustment Item' => __('Adjustment Item', 'aforms'), 
    'Adds a fixed detail line to be excluded from the total.' => __('Adds a fixed detail line to be excluded from the total.', 'aforms'), 
    'Stop' => __('Stop', 'aforms'), 
    'Stops form submission under certain conditions.' => __('Stops form submission under certain conditions.', 'aforms'), 
    'Message' => __('Message', 'aforms'), 
    'Separete with ",". Form submission is stopped if all of the above conditions are met.' => __('Separete with ",". Form submission is stopped if all of the above conditions are met.', 'aforms'), 
    'Appears when the form submission was stopped.' => __('Appears when the form submission was stopped.', 'aforms'), 
    'File' => __('File', 'aforms'), 
    'Number of Files' => __('Number of Files', 'aforms'), 
    '1 File' => __('1 File', 'aforms'), 
    'Multiple Files' => __('Multiple Files', 'aforms'), 
    'Acceptable Extensions' => __('Acceptable Extensions', 'aforms'), 
    'Enter extensions separated by commas, without dots. It is not case-sensitive.' => __('Enter extensions separated by commas, without dots. It is not case-sensitive.', 'aforms'), 
    'Max File Size' => __('Max File Size', 'aforms'), 
    'You can use magnifications of K, M, and G. If left blank, the size is unlimited.' => __('You can use magnifications of K, M, and G. If left blank, the size is unlimited.', 'aforms')
);
$catalog['SALE'] = $word['SALE'];
$catalog['RECOMMENDED'] = $word['RECOMMENDED'];

$output['catalog'] = $catalog;
$output['noimageUrl'] = $urlHelper->asset('/asset/noimage.png');
$output['submitUrl'] = $urlHelper->ajax('wq-form-set', array('edit', 'placeholder'));
$output['editUrl'] = $urlHelper->adminPage('wq-form', array('edit', 'placeholder'));
$output['pvUrl'] = $urlHelper->adminPage('wq-form', array('preview', 'placeholder'));

wp_enqueue_script('form-js', $urlHelper->asset('/asset/admin_form.js'), array('jquery'), \AFormsWrap::VERSION);
wp_localize_script('form-js', 'wqData', $output);
//wp_enqueue_style('material-icons', 'https://fonts.googleapis.com/icon?family=Material+Icons');
wp_enqueue_style('admin-css', $urlHelper->asset('/asset/admin.css'), array(), \AFormsWrap::VERSION);
wp_enqueue_media();

?>
<?php
/*
 * Some theme intrusively embed own contents into admin pages. 
 * That uses .wp-header-end as an installation marker, so.
 */
?>
<?php
/*
 * parcelがmaterial-icons.cssの中にあるurl()を適切に処理してくれないのでここに書く。
 */
$fontBase = $urlHelper->asset('/asset/');
?>
<style>
@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: url(<?= $fontBase ?>MaterialIcons-Regular.eot); /* For IE6-8 */
  src: local('Material Icons'),
       local('MaterialIcons-Regular'),
       url(<?= $fontBase ?>MaterialIcons-Regular.woff2) format('woff2'),
       url(<?= $fontBase ?>MaterialIcons-Regular.woff) format('woff'),
       url(<?= $fontBase ?>MaterialIcons-Regular.ttf) format('truetype');
}

.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;  /* Preferred icon size */
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;

  /* Support for all WebKit browsers. */
  -webkit-font-smoothing: antialiased;
  /* Support for Safari and Chrome. */
  text-rendering: optimizeLegibility;

  /* Support for Firefox. */
  -moz-osx-font-smoothing: grayscale;

  /* Support for IE. */
  font-feature-settings: 'liga';
}
</style>
<div class="wrap">
<div class="wq-TitleBar">
  <h1 class="wp-heading-inline"><?= htmlspecialchars($output['catalog']['Form Details']) ?></h1>
  <div class="wq--spacer"></div>
  <div class="wq--link"><a id="preview-link" href="<?= str_replace('placeholder', $output['form']->id, $output['pvUrl']) ?>" target="_blank"><?= htmlspecialchars($output['catalog']['Preview']) ?></a></div>
  <button id="save-button" class="button button-primary button-large"><?= htmlspecialchars($output['catalog']['Save']) ?></button>
</div>
<hr class="wp-header-end" />
<div id="root"></div>
</div>