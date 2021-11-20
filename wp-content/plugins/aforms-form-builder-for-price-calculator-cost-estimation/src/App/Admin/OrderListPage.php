<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;

class OrderListPage extends OrderList 
{
    public function __construct($session, $orderRepo, $extRepo) 
    {
        parent::__construct($session, $orderRepo, $extRepo);
    }

    public function __invoke($page, $_inputs, $payload) 
    {
        // authentication
        if (! $this->session->isLoggedIn()) {
            return $payload->setStatus(Status::NOT_AUTHENTICATED);
        }

        // authorization
        if (! $this->session->isAdmin()) {
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        }
        
        $offset = ($page - 1) * self::LIMIT;
        $orders = $this->orderRepo->slice($offset, self::LIMIT);
        $orders = $this->extRepo->extendOrders($orders);
        $count = $this->orderRepo->count();
        
        $paging = new \stdClass();
        $paging->lastPage = ceil($count / self::LIMIT);
        $paging->firstPage = 1;
        $paging->page = $page;
        $paging->total = $count;

        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput(array('orders' => $orders, 'paging' => $paging));
    }
}