<?php

namespace AForms\App\Front;

use AForms\Domain\InputProcessor;
use AForms\Domain\MailComposer;
use AForms\Domain\OrderException;
use AForms\Domain\FormProcessor;
use Aura\Payload_Interface\PayloadStatus as Status;

class OrderNew 
{
    protected $formRepo;
    protected $ruleRepo;
    protected $wordRepo;
    protected $orderRepo;
    protected $mailer;
    protected $session;
    protected $options;
    protected $scorer;
    protected $extRepo;

    public function __construct($formRepo, $ruleRepo, $wordRepo, $orderRepo, $mailer, $session, $options, $scorer, $extRepo) 
    {
        $this->formRepo = $formRepo;
        $this->ruleRepo = $ruleRepo;
        $this->wordRepo = $wordRepo;
        $this->orderRepo = $orderRepo;
        $this->mailer = $mailer;
        $this->session = $session;
        $this->options = $options;
        $this->scorer = $scorer;
        $this->extRepo = $extRepo;
    }

    protected function notify($form, $order, $rule, $word) 
    {
        $compose = new MailComposer($this->session, $rule, $word, $this->options);
        $to = $compose->findAttrByType($order, 'Email');

        if ($to) {
            $mail = (object)array(
                'to' => $to, 
                'fromName' => $form->mail->fromName, 
                'fromAddress' => $form->mail->fromAddress, 
                'subject' => $form->mail->subject, 
                'body' => $compose($order, $form->mail->textBody, true), 
                'attachments' => ''
            );
            $mail = $this->options->extendThanksMail($mail, $form, $order);
            $this->mailer->setTo($mail->to)
                         ->setFrom($mail->fromName, $mail->fromAddress)
                         ->setSubject($mail->subject)
                         ->setTextBody($mail->body)
                         ->setAttachments($mail->attachments)
                         ->send()
                         ->clear();
        }

        if ($form->mail->notifyTo && !property_exists($order->condition, 'quiet')) {
            $mail = (object)array(
                'to' => $form->mail->notifyTo, 
                'fromName' => $form->mail->fromName, 
                'fromAddress' => $form->mail->fromAddress, 
                'subject' => $form->mail->subject, 
                'body' => $compose($order, $form->mail->textBody, false), 
                'attachments' => ''
            );
            $mail = $this->options->extendReportMail($mail, $form, $order);
            $this->mailer->setTo($mail->to)
                         ->setFrom($mail->fromName, $mail->fromAddress)
                         ->setSubject($mail->subject)
                         ->setTextBody($mail->body)
                         ->setAttachments($mail->attachments)
                         ->send()
                         ->clear();
        }
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

        // order id is assigned here
        $this->orderRepo->add($order);

        // Immediately after the order data is completed
        $this->extRepo->onStoreOrder($order, $form);

        if ($iproc->hasWarnings()) {
            $this->warn($iproc->composeWarnings(), $form);
        }

        $this->notify($form, $order, $rule, $word);

        $responseSpec = $fproc->getResponseSpec($form, $order, $word);
        $responseSpec = $this->extRepo->extendResponseSpec($responseSpec, $form, $order);

        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput($responseSpec);
    }
}