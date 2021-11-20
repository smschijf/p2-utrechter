<?php

namespace AForms\Infra;

use \Toml;

class WpOptions 
{
    protected $tpldir;
    protected $catalogLoaded = false;
    protected $siteIni = null;

    public function __construct($tpldir) 
    {
        $this->tpldir = $tpldir;
    }

    protected function loadCatalog() 
    {
        //load_plugin_textdomain('aforms', false, $this->tpldir);
        $this->catalogLoaded = true;
    }

    public function getDefaultMail($formId)
    {
        $mail = new \stdClass();
        $mail->subject = $this->translate('Thank you for your order', $formId);
        $mail->fromAddress = get_option('admin_email');
        $mail->fromName = get_option('blogname');
        $mail->notifyTo = '';
        $mail->textBody = $this->translate('Thank you for your order.', $formId);
        return $mail;
    }

    public function getDefaultFormTitle($formId) 
    {
        return $this->translate('New Form', $formId);
    }

    public function getWarningMail($content, $form) 
    {
        $mail = new \stdClass();
        $mail->subject = sprintf($this->translate('[%s] Evaluation Errors occurred on your form', $form->id), get_option('blogname'));
        $mail->fromAddress = get_option('admin_email');
        $mail->fromName = get_option('blogname');
        $mail->to = get_option('admin_email');
        $mail->textBody = sprintf($this->translate("Evaluation Errors occurred on your form.\n\n Form: %s [%d]\n\n%s", $form->id), $form->title, $form->id, $content);
        return $mail;
    }

    public function translate($str, $formId) 
    {
        return __($str, 'aforms');
    }

    public function extendForm($form) 
    {
        return apply_filters('aforms_get_form', $form);
    }

    public function extendRule($rule, $form) 
    {
        return apply_filters('aforms_load_rule', $rule, $form);
    }

    public function extendWordDefinition($word) 
    {
        return apply_filters('aforms_define_word', $word);
    }

    public function extendWord($word, $form) 
    {
        return apply_filters('aforms_load_word', $word, $form);
    }

    public function extendBehavior($behavior, $form) 
    {
        return apply_filters('aforms_load_behavior', $behavior, $form);
    }

    public function extendStylesheetUrl($url, $form) 
    {
        return apply_filters('aforms_get_stylesheet', $url, $form);
    }

    public function extendSidebarSelector($sidebarSelector, $formId) 
    {
        return apply_filters('aforms_get_sidebar_selector', $sidebarSelector, $formId);
    }

    public function extendThanksMail($mail, $form, $order) 
    {
        return apply_filters('aforms_compose_thanks_mail', $mail, $form, $order);
    }

    public function extendReportMail($mail, $form, $order) 
    {
        return apply_filters('aforms_compose_report_mail', $mail, $form, $order);
    }

    public function extendAvailableExtensions($exts = null) 
    {
        if ($exts === null) $exts = array();
        return apply_filters('aforms_load_available_extensions', $exts);
    }

    public function extendActionSpecMap($actionSpecMap, $form) 
    {
        return apply_filters('aforms_get_action_spec_map', $actionSpecMap, $form);
    }

    public function extendResponseSpec($responseSpec, $form, $order) 
    {
        return apply_filters('aforms_get_response_spec', $responseSpec, $form, $order);
    }

    public function extendCustomResponseSpec($responseSpec, $customId, $form, $order) 
    {
        return apply_filters('aforms_get_custom_response_spec', $responseSpec, $customId, $form, $order);
    }

    public function validateFiles($error, $files, $item, $form) 
    {
        return apply_filters('aforms_validate_files', $error, $files, $item, $form);
    }

    public function extendOrderAttr($attr, $item, $form) 
    {
        return apply_filters('aforms_get_order_attr', $attr, $item, $form);
    }

    public function extendScriptDeps($deps, $form) 
    {
        return apply_filters('aforms_get_script_deps', $deps, $form);
    }

    public function onLoadScript($form) 
    {
        return do_action('aforms_on_load_script', $form);
    }

    public function onCreateOrder($order, $form, $inputs) 
    {
        do_action('aforms_on_create_order', $order, $form, $inputs);
    }

    public function onStoreOrder($order, $form) 
    {
        do_action('aforms_on_store_order', $order, $form);
    }

    public function extendOrders($orders) 
    {
        return apply_filters('aforms_get_orders', $orders);
    }
}