<?php
namespace AForms\Shell;
use tyam\bamboo\VariableProvider;
class HtmlResponder implements VariableProvider
{
    protected $bamboo;
    protected $urlHelper;
    protected $resolver;
    protected $tpldir;
    protected $echo;
    public function __construct($bamboo, $urlHelper, $resolver, $tpldir) 
    {
        $this->bamboo = $bamboo;
        $this->urlHelper = $urlHelper;
        $this->resolver = $resolver;
        $this->tpldir = $tpldir;
        $this->echo = false;
        $this->bamboo->setVariableProvider($this);
    }
    public function isEcho() 
    {
        return $this->echo;
    }
    public function setEcho($flag) 
    {
        $this->echo = $flag;
    }
    public function provideVariables($template) 
    {
        return array(
            'urlHelper' => $this->urlHelper, 
            'resolve' => $this->resolver, 
            'tpldir' => $this->tpldir
        );
    }
    
    public function __invoke($template, $payload = null) 
    {
        $vars = array(
            'output' => ($payload) ? $payload->getOutput() : null, 
            'status' => ($payload) ? $payload->getStatus() : 'SUCCESS'
        );
        $html = $this->bamboo->render($template, $vars);
        if ($this->echo) {
            echo $html;
            return;
        } else {
            return $html;
        }
    }
}