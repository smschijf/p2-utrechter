<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;

class SettingsSet 
{
    protected $ruleRepository;
    protected $wordRepository;
    protected $behaviorRepository;
    protected $validator;
    protected $session;

    public static function getRuleSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'taxIncluded' => (object)array(
                    'type' => 'boolean'
                ), 
                'taxRate' => (object)array(
                    'type' => 'number', 
                    'minimum' => 0
                ), 
                'taxNormalizer' => (object)array(
                    'type' => 'string', 
                    'enum' => array('floor', 'ceil', 'round', 'trunc')
                ), 
                'taxPrecision' => (object)array(
                    'type' => 'integer'
                )
            ), 
            'required' => array('taxIncluded', 'taxRate', 'taxNormalizer', 'taxPrecision')
        );
    }
    
    public static function getWordSchema() 
    {
        return (object)array(
            'type' => 'object'
        );
    }

    public static function getBehaviorSchema() 
    {
        return (object)array(
            'type' => 'object', 
            'properties' => (object)array(
                'smoothScroll' => (object)array('type' => 'boolean')
            ), 
            'required' => array('smoothScroll')
        );
    }

    public function __construct($ruleRepository, $wordRepository, $behaviorRepository, $validator, $session) 
    {
        $this->ruleRepository = $ruleRepository;
        $this->wordRepository = $wordRepository;
        $this->behaviorRepository = $behaviorRepository;
        $this->validator = $validator;
        $this->session = $session;
    }

    public function validate($form, $payload) 
    {
        //var_dump($form);
        if (! property_exists($form, 'rule') || ! property_exists($form, 'word') ||  ! property_exists($form, 'behavior')) {
            // out of domain
            $payload->setStatus(Status::NOT_VALID);
            return false;
        }

        $ruleSchema = self::getRuleSchema();
        $this->validator->coerce($form->rule, $ruleSchema);
        if (! $this->validator->isValid()) {
            // out of domain
            $payload->setStatus(Status::NOT_VALID);
            return false;
        }

        $wordSchema = self::getWordSchema();
        $this->validator->coerce($form->word, $wordSchema);
        if (! $this->validator->isValid()) {
            // out of domain
            $payload->setStatus(Status::NOT_VALID);
            return false;
        }

        $behaviorSchema = self::getBehaviorSchema();
        $this->validator->coerce($form->behavior, $behaviorSchema);
        if (! $this->validator->isValid()) {
            // out of domain
            $payload->setStatus(Status::NOT_VALID);
            return false;
        }

        return true;
    }

    public function __invoke($form, $payload) 
    {
        if (! $this->session->isLoggedIn()) {
            return $payload->setStatus(Status::NOT_AUTHENTICATED);
        }
        
        if (! $this->session->isAdmin()) {
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        }

        if (! $this->validate($form, $payload)) {
            return $payload;
        }

        $this->ruleRepository->save($form->rule);
        $this->wordRepository->save($form->word);
        $this->behaviorRepository->save($form->behavior);

        return $payload->setStatus(Status::SUCCESS);
    }
}
