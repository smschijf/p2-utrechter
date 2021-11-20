<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;

class Preview 
{
    public function __invoke($_preview, $id, $_inputs, $payload) 
    {
        return $payload->setStatus(Status::SUCCESS)->setOutput(array('id' => $id));
    }

}