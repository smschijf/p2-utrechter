<?php

namespace AForms\App\Front;

use AForms\Domain\InputProcessor;
use AForms\Domain\MailComposer;
use AForms\Domain\OrderException;
use AForms\Domain\FormProcessor;
use Aura\Payload_Interface\PayloadStatus as Status;

class Custom 
{
    protected $formRepo;
    protected $ruleRepo;
    protected $wordRepo;
    protected $session;
    protected $options;
    protected $scorer;
    protected $mailer;
    protected $extRepo;

    public function __construct($formRepo, $ruleRepo, $wordRepo, $session, $options, $scorer, $mailer, $extRepo) 
    {
        $this->formRepo = $formRepo;
        $this->ruleRepo = $ruleRepo;
        $this->wordRepo = $wordRepo;
        $this->session = $session;
        $this->options = $options;
        $this->scorer = $scorer;
        $this->mailer = $mailer;
        $this->extRepo = $extRepo;
    }

    protected function warn($content, $form) 
    {
        $mail = $this->options->getWarningMail($content, $form);
        $this->mailer->setTo($mail->to)
                     ->setFrom($mail->fromName, $mail->fromAddress)
                     ->setSubject($mail->subject)
                     ->setTextBody($mail->textBody)
                     ->send()
                     ->clear();
    }

    public function __invoke($customId, $inputs, $payload) 
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
        $form = $this->extRepo->extendForm($form);

        $fproc = new FormProcessor();

        $fproc->aim($form, $this->extRepo);

        $rule = $this->options->extendRule($this->ruleRepo->load(), $form);
        $word = $this->options->extendWord($this->wordRepo->load(), $form);

        $iproc = new InputProcessor($this->scorer, $this->options, $rule, $word);
        try {
            $order = $iproc($form, $inputs);
            $this->extRepo->onCreateOrder($order, $form, $inputs);
        } catch (OrderException $e) {
            error_log($e->getTraceAsString());
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        } catch (\Exception $e) {
            error_log($e->getTraceAsString());
            return $payload->setStatus(Status::NOT_VALID);
        }

        if ($iproc->hasWarnings()) {
            $this->warn($iproc->composeWarnings(), $form);
        }

        // do extension-defined something
        $responseSpec = $fproc->getCustomResponseSpec();
        $responseSpec = $this->extRepo->extendCustomResponseSpec($responseSpec, $customId, $form, $order);

        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput($responseSpec);
    }
}