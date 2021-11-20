<?php

namespace AForms\Infra;

class WordMapper 
{
    const KEY = 'wp_aforms_word_settings';

    protected $wpdb;
    protected $extRepo;
    protected $cache;

    public function __construct($wpdb, $extRepo) 
    {
        $this->wpdb = $wpdb;
        $this->extRepo = $extRepo;
        $this->cache = null;
    }

    protected function getDefaultAsArray() 
    {
        return array(
            'No' => __('No', 'aforms'),  // #
            'Category' => __('Category', 'aforms'),  // カテゴリー
            'Entry' => __('Entry', 'aforms'),  // 項目
            'Unit Price' => __('Unit Price', 'aforms'),  // 単価
            'Quantity' => __('Quantity', 'aforms'),  // 数量
            'Price' => __('Price', 'aforms'),  // 金額
            'Subtotal' => __('Subtotal', 'aforms'),  // 小計
            'Tax' => __('Tax', 'aforms'),  // 消費税
            'Total' => __('Total', 'aforms'),  // 合計, 
            'required' => __('required', 'aforms'),  // 必須
            'Input here' => __('Input here', 'aforms'),  // 入力してください
            'Invalid' => __('Invalid', 'aforms'),  // 不正です
            'Check here' => __('Check here', 'aforms'),  // チェックを入れてください
            'Select here' => __('Select here', 'aforms'),  // 選んでください
            'Repeat here' => __('Repeat here', 'aforms'),  // 同じ文字を入力してください
            'Zip' => __('Zip', 'aforms'),  // 郵便番号
            'To Confirmation Screen' => __('To Confirmation Screen', 'aforms'),  // 確認画面へ
            'Your Name' => __('Your Name', 'aforms'), 
            'First Name' => __('First Name', 'aforms'), 
            'Last Name' => __('Last Name', 'aforms'), 
            'info@example.com' => __('info@example.com', 'aforms'), 
            'Confirm again' => __('Confirm again', 'aforms'), 
            '03-1111-2222' => __('03-1111-2222', 'aforms'), 
            '000-0000' => __('000-0000', 'aforms'), 
            'Tokyo' => __('Tokyo', 'aforms'), 
            'Chiyoda-ku' => __('Chiyoda-ku', 'aforms'), 
            '1-1-1, Chiyoda' => __('1-1-1, Chiyoda', 'aforms'), 
            'Chiyoda mansion 8F' => __('Chiyoda mansion 8F', 'aforms'), 
            'Processing stopped due to preview mode.' => __('Processing stopped due to preview mode.', 'aforms'), 
            'Submit' => __('Submit', 'aforms'), 
            'Back' => __('Back', 'aforms'), 
            'Please check your entry.' => __('Please check your entry.', 'aforms'), 
            'Hide Monitor' => __('Hide Monitor', 'aforms'), 
            'Show Monitor' => __('Show Monitor', 'aforms'), 
            'Start Order' => __('Start Order', 'aforms'), 
            'Close' => __('Close', 'aforms'), 
            'Previous' => __('Previous', 'aforms'), 
            'Next' => __('Next', 'aforms'), 
            'There exists uninput item.' => __('There exists uninput item.', 'aforms'), 
            'The form has been successfully submitted.' => __('The form has been successfully submitted.', 'aforms'), 
            '^[0-9]{3}-?[0-9]{4}$' => __('^[0-9]{3}-?[0-9]{4}$', 'aforms'), 
            'Checked' => __('Checked', 'aforms'), 
            'Too small' => __('Too small', 'aforms'), 
            'Too large' => __('Too large', 'aforms'), 
            'Please select' => __('Please select', 'aforms'), 
            'Input in Hiragana' => __('Input in Hiragana', 'aforms'), 
            'Input in Katakana' => __('Input in Katakana', 'aforms'), 
            'optional' => __('optional', 'aforms'), 
            'SALE' => __('SALE', 'aforms'), 
            'RECOMMENDED' => __('RECOMMENDED', 'aforms'), 
            'Tax Class' => __('Tax Class', 'aforms'),  // +
            '(%s%% applied)' => __('(%s%% applied)', 'aforms'),  // +
            'Tax (%s%%)' => __('Tax (%s%%)', 'aforms'),  // +
            '(common %s%% applied)' => __('(common %s%% applied)', 'aforms'),  // +
            'Tax (common %s%%)' => __('Tax (common %s%%)', 'aforms'), 
            '%s (x %s) %s %s' => __('%s (x %s) %s %s', 'aforms'), 
            '%s: %s' => __('%s: %s', 'aforms'), 
            "== %s ==\n%s" => __("== %s ==\n%s", 'aforms'), 
            ', ' => __(', ', 'aforms'), 
            '$%s' => __('$%s', 'aforms'), 
            '.' => __('.', 'aforms'), 
            ',' => __(',', 'aforms'), 
            'Regular Unit Price' => __('Regular Unit Price', 'aforms'), 
            'Quotation Details' => __('Quotation Details', 'aforms'), 
            'Deselect' => __('Deselect', 'aforms'), 
            'evaluation error: overflow in %s' => __('evaluation error: overflow in %s', 'aforms'), 
            'evaluation error: no-variable in %s' => __('evaluation error: no-variable in %s', 'aforms'), 
            'evaluation error: no-quantity in %s' => __('evaluation error: no-quantity in %s', 'aforms'), 
            'evaluation error: undefined-calculation in %s' => __('evaluation error: undefined-calculation in %s', 'aforms'), 
            'evaluation error: no-function in %s' => __('evaluation error: no-function in %s', 'aforms'), 
            'evaluation error: unknown-term in %s' => __('evaluation error: unknown-term in %s', 'aforms'), 
            'OK' => __('OK', 'aforms'), 
            'Your document is ready.' => __('Your document is ready.', 'aforms'), 
            'Open' => __('Open', 'aforms'), 
            'Skip' => __('Skip', 'aforms'), 
            'Removing the file. Are you sure?' => __('Removing the file. Are you sure?', 'aforms'), 
            'Drop files here or click' => __('Drop files here or click', 'aforms'), 
            'Wait for upload' => __('Wait for upload', 'aforms'), 
            'x%s' => __('x%s', 'aforms'), 
            'evaluation error: no matching clause in %s' => __('evaluation error: no matching clause in %s', 'aforms')
        );
    }

    public function load() 
    {
        if ($this->cache) {
            return $this->cache;
        }

        $default = $this->getDefaultAsArray();
        $word0 = get_option(self::KEY, '{}');
        $word = json_decode($word0, true);
        $word = array_merge($default, $word);
        $word = $this->extRepo->extendWordDefinition($word);
        $this->cache = $word;
        return $word;
    }

    public function save($word) 
    {
        update_option(self::KEY, json_encode($word));
    }
}