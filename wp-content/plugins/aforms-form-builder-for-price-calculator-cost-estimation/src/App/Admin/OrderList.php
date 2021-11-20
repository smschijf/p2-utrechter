<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;

class OrderList 
{
    protected $session;
    protected $orderRepo;
    protected $extRepo;
    const LIMIT = 20;

    public function __construct($session, $orderRepo, $extRepo) 
    {
        $this->session = $session;
        $this->orderRepo = $orderRepo;
        $this->extRepo = $extRepo;
    }

    public function __invoke($_inputs, $payload) 
    {
        // authentication
        if (! $this->session->isLoggedIn()) {
            return $payload->setStatus(Status::NOT_AUTHENTICATED);
        }

        // authorization
        if (! $this->session->isAdmin()) {
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        }
        
        $orders = $this->orderRepo->slice(0, self::LIMIT);
        $orders = $this->extRepo->extendOrders($orders);
        $count = $this->orderRepo->count();
        
        $paging = new \stdClass();
        $paging->lastPage = ceil($count / self::LIMIT);
        $paging->firstPage = 1;
        $paging->page = 1;
        $paging->total = $count;

        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput(array('orders' => $orders, 'paging' => $paging));
    }
}