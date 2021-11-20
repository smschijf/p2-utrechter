<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;

class OrderDel 
{
    protected $orderRepo;
    protected $session;

    public function __construct($orderRepo, $session) 
    {
        $this->orderRepo = $orderRepo;
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

        $order = $this->orderRepo->findById($id);
        if (! $order) {
            return $payload->setStatus(Status::NOT_FOUND);
        }

        $this->orderRepo->remove($order);

        return $payload->setStatus(Status::SUCCESS)->setOutput(null);
    }
}