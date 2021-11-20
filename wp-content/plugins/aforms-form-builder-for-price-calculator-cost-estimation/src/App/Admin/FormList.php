<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;

class FormList 
{
    protected $formRepo;
    protected $session;

    public function __construct($formRepo, $session) 
    {
        $this->formRepo = $formRepo;
        $this->session = $session;
    }

    public function __invoke($_form, $payload) 
    {
        if (! $this->session->isLoggedIn()) {
            return $payload->setStatus(Status::NOT_AUTHENTICATED);
        }
        
        if (! $this->session->isAdmin()) {
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        }

        $forms = $this->formRepo->getList();

        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput(array('forms' => $forms));
    }
}