<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;
use AForms\Domain\FormProcessor;

class FormSet 
{
    protected $formRepo;
    protected $session;
    protected $validator;

    const LABEL_PATTERN = '^([a-zA-Z0-9-_]+)?( *, *[a-zA-Z0-9-_]+)*$';
    const DEPEND_PATTERN = '^(!?[a-zA-Z0-9-_]+)?( *, *(!?[a-zA-Z0-9-_])+)*$';
    const EMAIL_PATTERN = '^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$';
    const EXT_PATTERN = '^([a-zA-Z0-9]+)?( *, *[a-zA-Z0-9]+)*$';
    const SIZE_PATTERN = '^[1-9][0-9]*(k|K|m|M|g|G)?$';

    public static function getGeneralSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'title' => (object)array('type' => 'string'), 
                'navigator' => (object)array(
                    'type' => 'string', 
                    'enum' => array('horizontal', 'wizard')
                ), 
                'doConfirm' => (object)array('type' => 'boolean'), 
                'thanksUrl' => (object)array(
                    'anyOf' => array(
                        (object)array('type' => 'string', 'format' => 'uri'), 
                        (object)array('type' => 'string', 'maxLength' => 0)
                    )
                )
            ), 
            'required' => array('title', 'navigator', 'doConfirm', 'thanksUrl')
        );
    }

    public static function getMailSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'subject' => (object)array('type' => 'string', 'minLength' => 1), 
                'fromAddress' => (object)array('type' => 'string', 'minLength' => 1, 'pattern' => self::EMAIL_PATTERN), 
                'fromName' => (object)array('type' => 'string'), 
                'notifyTo' => (object)array(
                    'anyOf' => array(
                        (object)array('type' => 'string', 'pattern' => self::EMAIL_PATTERN), 
                        (object)array('type' => 'string', 'maxLength' => 0)
                    )
                ), 
                'textBody' => (object)array('type' => 'string')
            ), 
            'required' => array('subject', 'fromAddress', 'fromName', 'notifyTo', 'textBody')
        );
    }

    public static function getAutoSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^Auto$'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'category' => (object)array('type' => 'string'), 
                'normalPrice' => (object)array('type' => array('number', 'null')), 
                'price' => (object)array('type' => 'string'), 
                'priceAst' => (object)array(), 
                'priceVars' => (object)array(), 
                'taxRate' => (object)array('type' => array('number', 'null'), 'minimum' => 0), 
                'quantity' => (object)array('type' => 'integer'), 
                'depends' => (object)array('type' => 'string', 'pattern' => self::DEPEND_PATTERN)
            ), 
            'required' => array('id', 'type', 'name', 'category', 'normalPrice', 'price', 'priceAst', 'priceVars', 'quantity', 'taxRate', 'depends')
        );
    }

    public static function getAdjustmentSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^Adjustment$'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'category' => (object)array('type' => 'string'), 
                'normalPrice' => (object)array('type' => array('number', 'null')), 
                'price' => (object)array('type' => 'string'), 
                'priceAst' => (object)array(), 
                'priceVars' => (object)array(), 
                'taxRate' => (object)array('type' => array('number', 'null'), 'minimum' => 0), 
                'quantity' => (object)array('type' => 'integer'), 
                'depends' => (object)array('type' => 'string', 'pattern' => self::DEPEND_PATTERN)
            ), 
            'required' => array('id', 'type', 'name', 'category', 'normalPrice', 'price', 'priceAst', 'priceVars', 'quantity', 'taxRate', 'depends')
        );
    }

    public static function getQuantitySchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^Quantity$'), 
                'image' => (object)array('type' => 'string'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'allowFraction' => (object)array('type' => 'boolean'), 
                'initial' => (object)array('type' => 'number'), 
                'minimum' => (object)array('type' => array('number', 'null'), 'minimum' => 0), 
                'maximum' => (object)array('type' => array('number', 'null'), 'minimum' => 0), 
                'suffix' => (object)array('type' => 'string'), 
                'note' => (object)array('type' => 'string'), 
                'depends' => (object)array('type' => 'string', 'pattern' => self::DEPEND_PATTERN)
            ), 
            'required' => array('id', 'type', 'name', 'allowFraction', 'initial', 'minimum', 'maximum', 'suffix', 'note', 'depends')
        );
    }

    public static function getAutoQuantitySchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^AutoQuantity$'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'quantity' => (object)array('type' => 'string'), 
                'quantityAst' => (object)array(), 
                'quantityVars' => (object)array()
            ), 
            'required' => array('id', 'type', 'name', 'quantity', 'quantityAst', 'quantityVars')
        );
    }

    public static function getSliderSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^Slider$'), 
                'image' => (object)array('type' => 'string'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'initial' => (object)array('type' => 'number'), 
                'minimum' => (object)array('type' => 'number'), 
                'maximum' => (object)array('type' => 'number'), 
                'step' => (object)array('type' => 'number'), 
                'suffix' => (object)array('type' => 'string'), 
                'note' => (object)array('type' => 'string'), 
                'depends' => (object)array('type' => 'string', 'pattern' => self::DEPEND_PATTERN)
            ), 
            'required' => array('id', 'type', 'name', 'initial', 'minimum', 'maximum', 'step', 'suffix', 'note', 'depends')
        );
    }

    public static function getPriceWatcherSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^PriceWatcher$'), 
                'lower' => (object)array('type' => array('number', 'null')), 
                'lowerIncluded' => (object)array('type' => 'boolean'), 
                'higher' => (object)array('type' => array('number', 'null')), 
                'higherIncluded' => (object)array('type' => 'boolean'), 
                'labels' => (object)array('type' => 'string', 'pattern' => self::LABEL_PATTERN)
            ), 
            'required' => array('id', 'type', 'lower', 'lowerIncluded', 'higher', 'higherIncluded', 'labels')
        );
    }

    public static function getQuantityWatcherSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^QuantityWatcher$'), 
                'target' => (object)array('type' => 'integer'), 
                'lower' => (object)array('type' => array('number', 'null')), 
                'lowerIncluded' => (object)array('type' => 'boolean'), 
                'higher' => (object)array('type' => array('number', 'null')), 
                'higherIncluded' => (object)array('type' => 'boolean'), 
                'labels' => (object)array('type' => 'string', 'pattern' => self::LABEL_PATTERN)
            ), 
            'required' => array('id', 'type', 'target', 'lower', 'lowerIncluded', 'higher', 'higherIncluded', 'labels')
        );
    }

    public static function getSelectorSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^Selector$'), 
                'image' => (object)array('type' => 'string'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'note' => (object)array('type' => 'string'), 
                'multiple' => (object)array('type' => 'boolean'), 
                'quantity' => (object)array('type' => 'integer')
            ), 
            'required' => array('id', 'type', 'image', 'name', 'note', 'multiple', 'quantity')
        );
    }

    public static function getOptionSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^Option$'), 
                'image' => (object)array('type' => 'string'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'note' => (object)array('type' => 'string'), 
                'normalPrice' => (object)array('type' => array('number', 'null')), 
                'price' => (object)array('type' => array('number', 'null')), 
                'taxRate' => (object)array('type' => array('number', 'null'), 'minimum' => 0), 
                'ribbons' => (object)array(
                    'type' => 'object', 
                    'properties' => (object)array(
                        'RECOMMENDED' => (object)array('const' => true), 
                        'SALE' => (object)array('const' => true)
                    )
                ), 
                'labels' => (object)array('type' => 'string', 'pattern' => self::LABEL_PATTERN), 
                'depends' => (object)array('type' => 'string', 'pattern' => self::DEPEND_PATTERN)
            ), 
            'required' => array('id', 'type', 'image', 'name', 'note', 'normalPrice', 'price', 'taxRate', 'ribbons', 'labels', 'depends')
        );
    }

    public static function getQuantOptionSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^QuantOption$'), 
                'image' => (object)array('type' => 'string'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'note' => (object)array('type' => 'string'), 
                'normalPrice' => (object)array('type' => array('number', 'null')), 
                'price' => (object)array('type' => array('number', 'null')), 
                'taxRate' => (object)array('type' => array('number', 'null'), 'minimum' => 0), 
                'ribbons' => (object)array(
                    'type' => 'object', 
                    'properties' => (object)array(
                        'RECOMMENDED' => (object)array('const' => true), 
                        'SALE' => (object)array('const' => true)
                    )
                ), 
                'labels' => (object)array('type' => 'string', 'pattern' => self::LABEL_PATTERN), 
                'depends' => (object)array('type' => 'string', 'pattern' => self::DEPEND_PATTERN), 
                'minimum' => (object)array('type' => 'number'), 
                'maximum' => (object)array('type' => 'number'), 
                'step' => (object)array('type' => 'number'), 
                'suffix' => (object)array('type' => 'string')
            ), 
            'required' => array('id', 'type', 'image', 'name', 'note', 'normalPrice', 'price', 'taxRate', 'ribbons', 'labels', 'depends', 'minimum', 'maximum', 'step', 'suffix')
        );
    }

    public static function getStopSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^Stop$'), 
                'message' => (object)array('type' => 'string', 'minLength' => 1), 
                'depends' => (object)array('type' => 'string', 'pattern' => self::DEPEND_PATTERN)
            ), 
            'required' => array('id', 'type', 'message', 'depends')
        );
    }

    public static function getAllAttributes() 
    {
        return array(
            'Name', 'Email', 'Tel', 'Address', 
            'Checkbox', 'Radio', 'Dropdown', 'Text', 
            'MultiCheckbox', 'reCAPTCHA3', 'File'
        );
    }

    public static function getAttrSchema($type) 
    {
        if ($type == 'reCAPTCHA3') {
            return (object)array(
                'type' => 'object', 
                'properties' => (object)array(
                    'id' => (object)array('type' => 'integer'), 
                    'type' => (object)array('type' => 'string', 'pattern' => '^'.$type.'$'), 
                    'siteKey' => (object)array('type' => 'string'), 
                    'secretKey' => (object)array('type' => 'string'), 
                    'action' => (object)array('type' => 'string'), 
                    'threshold1' => (object)array('type' => 'number'), 
                    'threshold2' => (object)array('type' => 'number')
                ), 
                'required' => array('id', 'type', 'siteKey', 'secretKey', 'action', 'threshold1', 'threshold2')
            );
        }
        $rv = (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'id' => (object)array('type' => 'integer'), 
                'type' => (object)array('type' => 'string', 'pattern' => '^'.$type.'$'), 
                'name' => (object)array('type' => 'string', 'minLength' => 1), 
                'required' => (object)array('type' => 'boolean'), 
                'note' => (object)array('type' => 'string')
            ), 
            'required' => array('id', 'type', 'name', 'required')
        );

        if ($type == 'Name' || $type == 'Tel') {
            $rv->properties->divided = (object)array('type' => 'boolean');
            $rv->required[] = 'divided';
        }
        if ($type == 'Name') {
            $rv->properties->pattern = (object)array(
                'type' => 'string', 
                'enum' => array('none', 'katakana', 'hiragana')
            );
            $rv->required[] = 'pattern';
        }
        if ($type == 'Email') {
            $rv->properties->repeated = (object)array('type' => 'boolean');
            $rv->required[] = 'repeated';
        }
        if ($type == 'AutoFill') {
            $rv->properties->autoFill = (object)array(
                'type' => 'string', 
                'enum' => array('none', 'yubinbango')
            );
            $rv->required[] = 'autoFill';
        }
        if ($type == 'Radio' || $type == 'Dropdown' || $type == 'MultiCheckbox') {
            $rv->properties->options = (object)array('type' => 'string', 'minLength' => 1);
            $rv->required[] = 'options';
        }
        if ($type == 'Radio' || $type == 'Checkbox' || $type == 'Dropdown' || $type == 'MultiCheckbox') {
            $rv->properties->initialValue = (object)array('type' => 'string');
        }
        if ($type == 'Text') {
            $rv->properties->size = (object)array(
                'type' => 'string', 
                'enum' => array('nano', 'mini', 'small', 'normal', 'full')
            );
            $rv->properties->multiline = (object)array('type' => 'boolean');
            $rv->required[] = 'size';
            $rv->required[] = 'multiline';
        }
        if ($type == 'File') {
            $rv->properties->multiple = (object)array('type' => 'boolean');
            $rv->properties->extensions = (object)array('type' => 'string', 'pattern' => self::EXT_PATTERN);
            $rv->properties->maxsize = (object)array('type' => 'string', 'pattern' => self::SIZE_PATTERN);
            $rv->required[] = 'multiple';
            $rv->required[] = 'extensions';
            $rv->required[] = 'maxsize';
        }

        return $rv;
    }

    public function __construct($formRepo, $session, $validator) 
    {
        $this->formRepo = $formRepo;
        $this->session = $session;
        $this->validator = $validator;
    }

    protected function getValidationError($payload, $tag, $errors) 
    {
        $messages = array();
        foreach ($errors as $error) {
            $messages[] = $tag.": ".$error['property'].": ".$error['message'];
        }
        //var_dump($messages);exit;
        return $payload->setStatus(Status::NOT_VALID)->setMessages($messages);
    }

    protected function validateForm($form, $payload) 
    {
        // general
        $general = new \stdClass();
        $general->title = $form->title;
        $general->navigator = $form->navigator;
        $general->doConfirm = $form->doConfirm;
        $general->thanksUrl = $form->thanksUrl;
        $this->validator->coerce($general, self::getGeneralSchema());
        if (! $this->validator->isValid()) {
            return $this->getValidationError($payload, 'general', $this->validator->getErrors());
        }

        // detailItems
        $selectorSchema = self::getSelectorSchema();
        $autoSchema = self::getAutoSchema();
        $adjustmentSchema = self::getAdjustmentSchema();
        $optionSchema = self::getOptionSchema();
        $quantOptionSchema = self::getQuantOptionSchema();
        $priceWatcherSchema = self::getPriceWatcherSchema();
        $quantityWatcherSchema = self::getQuantityWatcherSchema();
        $quantitySchema = self::getQuantitySchema();
        $sliderSchema = self::getSliderSchema();
        $autoQuantitySchema = self::getAutoQuantitySchema();
        $stopSchema = self::getStopSchema();
        foreach ($form->detailItems as $item) {
            switch ($item->type) {
                case 'Auto': 
                    $this->validator->coerce($item, $autoSchema);
                    break;
                case 'Adjustment': 
                    $this->validator->coerce($item, $adjustmentSchema);
                    break;
                case 'Selector': 
                    $this->validator->coerce($item, $selectorSchema);
                    break;
                case 'PriceWatcher': 
                    $this->validator->coerce($item, $priceWatcherSchema);
                    break;
                case 'QuantityWatcher': 
                    $this->validator->coerce($item, $quantityWatcherSchema);
                    break;
                case 'Quantity': 
                    $this->validator->coerce($item, $quantitySchema);
                    break;
                case 'Slider': 
                    $this->validator->coerce($item, $sliderSchema);
                    break;
                case 'AutoQuantity': 
                    $this->validator->coerce($item, $autoQuantitySchema);
                    break;
                case 'Stop': 
                    $this->validator->coerce($item, $stopSchema);
                    break;
                default: 
                    return false;
            }
            if (! $this->validator->isValid()) {
                return $this->getValidationError($payload, "item[".$item->id."]", $this->validator->getErrors());
            }

            if ($item->type == "Selector") {
                foreach ($item->options as $option) {
                    switch ($option->type) {
                        case 'Option': 
                            $this->validator->coerce($option, $optionSchema);
                            break;
                        case 'QuantOption': 
                            $this->validator->coerce($option, $quantOptionSchema);
                            break;
                        default: 
                            return false;
                    }
                    if (! $this->validator->isValid()) {
                        return $this->getValidationError($payload, "option[".$item->id."][".$option->id."]", $this->validator->getErrors());
                    }
                }
            }
        }

        // attrItems
        foreach (self::getAllAttributes() as $attr) {
            $attrSchemas[$attr] = self::getAttrSchema($attr);
        }
        foreach ($form->attrItems as $item) {
            $this->validator->coerce($item, $attrSchemas[$item->type]);
            if (! $this->validator->isValid()) {
                return $this->getValidationError($payload, "attr[".$item->id."]", $this->validator->getErrors());
            }
        }

        // mail
        $this->validator->coerce($form->mail, self::getMailSchema());
        if (! $this->validator->isValid()) {
            return $this->getValidationError($payload, 'mail', $this->validator->getErrors());
        }

        return $payload;
    }

    public function __invoke($_edit, $id, $inputs, $payload) 
    {
        // authentication
        if (! $this->session->isLoggedIn()) {
            return $payload->setStatus(Status::NOT_AUTHENTICATED);
        }

        // authorization
        if (! $this->session->isAdmin()) {
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        }

        // validation
        $this->validateForm($inputs, $payload);
        if ($payload->getStatus() == Status::NOT_VALID) {
            return $payload;
        }

        // command
        (new FormProcessor())->compile($inputs);
        $inputs->author = $this->session->getUser();
        $inputs->modified = time();
        if ($id < 1) {
            // new
            $this->formRepo->add($inputs);
        } else {
            // edit
            $this->formRepo->sync($inputs);
        }

        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput(array('form' => $inputs));
    }
}