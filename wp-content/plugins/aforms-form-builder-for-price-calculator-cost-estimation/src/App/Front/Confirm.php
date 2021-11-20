<?php

namespace AForms\App\Front;

use AForms\Domain\InputProcessor;
use AForms\Domain\MailComposer;
use AForms\Domain\OrderException;
use Aura\Payload_Interface\PayloadStatus as Status;

class Confirm 
{
    protected $formRepo;
    protected $ruleRepo;
    protected $session;
    protected $options;
    protected $scorer;

    public function __construct($formRepo, $ruleRepo, $session, $options, $scorer) 
    {
        $this->formRepo = $formRepo;
        $this->ruleRepo = $ruleRepo;
        $this->session = $session;
        $this->options = $options;
        $this->scorer = $scorer;
    }

    public function __invoke($inputs, $payload) 
    {
        // no authentication

        // no authorization

        if (! $inputs->formId || ! intval($inputs->formId)) {
            return $payload->setStatus(Status::NOT_VALID);
        }
        $form = $this->formRepo->findById(intval($inputs->formId));
        if (! $form) {
            return $payload->setStatus(Status::NOT_VALID);
        }

        $rule = $this->ruleRepo->load();

        $proc = new InputProcessor($this->scorer, $this->options);
        try {
            $order = $proc($form, $rule, $inputs);
        } catch (OrderException $e) {
            error_log($e->getTraceAsString());
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        } catch (\Exception $e) {
            error_log($e->getTraceAsString());
            return $payload->setStatus(Status::NOT_VALID);
        }

        $output = $order;
        $output = $this->options->extendValue('aforms-confirm', $output, $form);

        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput($output);
    }
}