<?php

namespace AForms\App\Admin;

use Aura\Payload_Interface\PayloadStatus as Status;
use AForms\Domain\FormProcessor;

class FormRef 
{
    protected $formRepo;
    protected $session;
    protected $options;
    protected $extRepo;

    public function __construct($formRepo, $session, $options, $extRepo) 
    {
        $this->formRepo = $formRepo;
        $this->session = $session;
        $this->options = $options;
        $this->extRepo = $extRepo;
    }

    public function __invoke($cmd, $id, $_inputs, $payload) 
    {
        if (! $this->session->isLoggedIn()) {
            return $payload->setStatus(Status::NOT_AUTHENTICATED);
        }
        
        if (! $this->session->isAdmin()) {
            return $payload->setStatus(Status::NOT_AUTHORIZED);
        }
        
        if ($cmd == 'edit') {
            $form = $this->formRepo->findById($id);
            if (! $form) {
                return $payload->setStatus(Status::NOT_FOUND);
            }
            (new FormProcessor())->decompile($form, $this->extRepo);
        } else { // new
            $form = new \stdClass();
            $form->id = -1;
            $form->title = $this->options->getDefaultFormTitle(-1);
            $form->navigator = 'horizontal';
            $form->doConfirm = true;
            $form->thanksUrl = '';
            $form->author = $this->session->getUser();
            $form->modified = 0;
            $form->detailItems = array();
            $form->attrItems = array();
            $form->mail = $this->options->getDefaultMail(-1);
            $form->extensions = array();
        }
        //var_dump($form);exit;

        $schemas = array(
            'General' => FormSet::getGeneralSchema(), 
            'Auto' => FormSet::getAutoSchema(), 
            'Adjustment' => FormSet::getAdjustmentSchema(), 
            'Selector' => FormSet::getSelectorSchema(), 
            'Option' => FormSet::getOptionSchema(), 
            'QuantOption' => FormSet::getQuantOptionSchema(), 
            'PriceWatcher' => FormSet::getPriceWatcherSchema(), 
            'QuantityWatcher' => FormSet::getQuantityWatcherSchema(), 
            'Quantity' => FormSet::getQuantitySchema(), 
            'Slider' => FormSet::getSliderSchema(), 
            'AutoQuantity' => FormSet::getAutoQuantitySchema(), 
            'Stop' => FormSet::getStopSchema(), 
            'Mail' => FormSet::getMailSchema()
        );
        foreach (FormSet::getAllAttributes() as $attr) {
            $schemas[$attr] = FormSet::getAttrSchema($attr);
        }

        $output = array(
            'form' => $form, 
            'schemas' => $schemas, 
            'extensions' => $this->extRepo->getList(), 
            'fileEnabled' => $this->extRepo->testRole('file')
        );
        return $payload->setStatus(Status::SUCCESS)
                       ->setOutput($output);
    }
}