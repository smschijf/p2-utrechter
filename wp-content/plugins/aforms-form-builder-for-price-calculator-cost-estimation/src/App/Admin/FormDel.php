<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;

class FormDel 
{
    protected $formRepo;
    protected $session;

    public function __construct($formRepo, $session) 
    {
        $this->formRepo = $formRepo;
        $this->session = $session;
    }

    public function __invoke($_del, $id, $_inputs, $payload) 
    {
        // authentication
        if (! $this->session->isLoggedIn()) {
            return $payload->setStatus(Status::NOT_AUTHENTICATED);
        }

        // authorization
        if (! $this->session->isAdmin()) {
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        }

        $form = $this->formRepo->findById($id);
        if (! $form) {
            return $payload->setStatus(Status::NOT_FOUND);
        }

        $this->formRepo->remove($form);

        return $payload->setStatus(Status::SUCCESS)->setOutput(null);
    }
}