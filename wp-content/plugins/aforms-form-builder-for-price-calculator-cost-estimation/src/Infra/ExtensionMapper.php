<?php

namespace AForms\Infra;

class ExtensionMapper 
{
    protected $options;
    protected $cache;

    public function __construct($options) 
    {
        $this->options = $options;
        $this->cache = null;
    }

    public function getList() 
    {
        if (! is_null($this->cache)) return $this->cache;

        $exts = $this->options->extendAvailableExtensions();
        $this->migrate($exts);
        $this->cache = $exts;
        return $exts;
    }

    protected function migrate($exts) 
    {
        foreach ($exts as $ext) {
            if (! property_exists($ext, 'roles')) {
                $ext->roles = '';
            }
        }
    }

    public function testRole($role) 
    {
        $exts = $this->getList();
        foreach ($exts as $ext) {
            if (strpos($ext->roles, $role) !== false) return true;
        }
        return false;
    }

    public function testRoleForForm($role, $form) 
    {
        $exts = $this->getList();
        foreach ($exts as $ext) {
            if (strpos($ext->roles, $role) !== false && in_array($ext->id, $form->extensions)) return true; 
        }
        return false;
    }

    public function extendForm($form) 
    {
        return $this->options->extendForm($form);
    }

    public function onCreateOrder($order, $form, $inputs) 
    {
        $this->options->onCreateOrder($order, $form, $inputs);
    }

    public function onStoreOrder($order, $form) 
    {
        $this->options->onStoreOrder($order, $form);
    }

    public function extendActionSpecMap($actionSpecMap, $form) 
    {
        return $this->options->extendActionSpecMap($actionSpecMap, $form);
    }

    public function extendResponseSpec($responseSpec, $form, $order) 
    {
        return $this->options->extendResponseSpec($responseSpec, $form, $order);
    }

    public function extendCustomResponseSpec($responseSpec, $customId, $form, $order) 
    {
        return $this->options->extendCustomResponseSpec($responseSpec, $customId, $form, $order);
    }

    public function extendWordDefinition($word) 
    {
        return $this->options->extendWordDefinition($word);
    }

    public function extendOrders($orders) 
    {
        return $this->options->extendOrders($orders);
    }
}