<?php

namespace AForms\App\Front;

use Aura\Payload_Interface\PayloadStatus as Status;
use AForms\Domain\FormProcessor;

class FormRef 
{
    protected $formRepository;
    protected $session;
    protected $wordRepository;
    protected $extRepo;

    public function __construct($formRepository, $session, $wordRepository, $extRepo) 
    {
        $this->formRepository = $formRepository;
        $this->session = $session;
        $this->wordRepository = $wordRepository;
        $this->extRepo = $extRepo;
    }

    protected function getId($inputs) 
    {
        if (! isset($inputs->id)) {
            return null;
        }
        $id = intval($inputs->id);
        if ($inputs->id != "".$id) {
            return null;
        }
        
        return $id;
    }

    protected function getMode($inputs) 
    {
        if (isset($inputs->mode) && $inputs->mode == 'preview') {
            return 'preview';
        } else {
            return 'execute';
        }
    }

    protected function filter($form) 
    {
        foreach ($form->attrItems as $ai) {
            if ($ai->type == 'reCAPTCHA3') {
                // Erase secret properties.
                $ai->secretKey = '';
                $ai->threshold1 = 0;
                $ai->threshold2 = 0;
            }
        }
        
        $form->mail = (object)array();
    }

    public function __invoke($inputs, $payload) 
    {
        // no authentication
        // no authorization

        $id = $this->getId($inputs);
        if (is_null($id)) {
            return $payload->setStatus(Status::NOT_VALID);
        }

        $form = $this->formRepository->findById($id);
        if (! $form) {
            return $payload->setStatus(Status::NOT_FOUND);
        }
        $form = $this->extRepo->extendForm($form);

        $proc = new FormProcessor();
        
        $proc->aim($form, $this->extRepo);

        $actionSpecMap = $proc->getActionSpecMap($form, $this->wordRepository->load());
        $actionSpecMap = $this->extRepo->extendActionSpecMap($actionSpecMap, $form);

        $this->filter($form);

        $output = array(
            'form' => $form, 
            'mode' => $this->getMode($inputs), 
            'actionSpecMap' => $actionSpecMap
        );
        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput($output);
    }
}