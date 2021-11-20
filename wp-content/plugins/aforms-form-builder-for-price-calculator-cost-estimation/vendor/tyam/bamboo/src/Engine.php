<?php
/**
 * Engine
 *
 * A bamboo template engine, serving for PHP program side.
 */

namespace tyam\bamboo;

use ArrayObject;
use ArrayAccess;

class Engine
{
    const SEPARATOR = '/';
    const SUFFIX = '.php';

    /**
     * loads tyam\bamboo\functions.php.
     */
    public static function loadFunctions()
    {
        require_once(__DIR__ . DIRECTORY_SEPARATOR . 'functions.php');
    }

    private $basedirs;
    private $variableProvider;

    /**
     * instantiates a bamboo engine object.
     *
     * @param array $basedirs base directories for template files
     * @param VariableProvider|null $variableProvider 
     */
    public function __construct($basedirs, $variableProvider = null)
    {
        $this->basedirs = $basedirs;
        $this->variableProvider = $variableProvider;
    }

    /**
     * gets variable provider
     *
     * @return VariableProvider|null
     */
    public function getVariableProvider()
    {
        return $this->variableProvider;
    }

    /**
     * sets variable provider
     *
     * @param VariableProvider|null $variableProvider a variable provider to be set
     * @return void
     */
    public function setVariableProvider($variableProvider = null) 
    {
        $this->variableProvider = $variableProvider;
    }

    /**
     * Renders a specified template.
     *
     * @param string $template path to the template. The path is relative from basedirs
     * @param array|null $variables template variables to be passed to template
     * @param ArrayAccess|null $sections array like object to hold section values
     */
    public function render($template, $variables = null, $sections = null)
    {
        if (is_null($sections)) {
            $sections = new ArrayObject();
        }
        $renderer = new Renderer([$this, 'resolve'], $sections);
        $output = $renderer->render($template, $variables);
        return $output;
    }

    /**
     * Resolves a template path and template variables. You should not call this method.
     */
    public function resolve($template, $variables = null) 
    {
        return [
            $this->resolvePath($template), 
            $this->resolveEnv($template, $variables)
        ];
    }

    /**
     * Resolves a template path. You should not call this method.
     */
    public function resolvePath($template)
    {
        foreach ($this->basedirs as $basedir) {
            $path = $basedir . self::SEPARATOR . $template . self::SUFFIX;
            $path = str_replace(self::SEPARATOR, DIRECTORY_SEPARATOR, $path);
            if (file_exists($path)) {
                return $path;
            }
        }
        // template not found
        throw new \LogicException('template not found: '.$template);
    }

    /**
     * Resolves a template variables. You should not call this method.
     */
    public function resolveEnv($template, $variables = null)
    {
        if (is_null($variables)) {
            $variables = [];
        }
        
        $env = $this->getAutoBindings($template);
        // explicit-bound variables precedes to auto-bound variables.
        return array_merge($env, $variables);
    }

    /**
     * Pulls template variables from variableProvider, if there.
     */
    protected function getAutoBindings($template)
    {
        if (is_null($this->variableProvider)) {
            return [];
        }

        $bindings = $this->variableProvider->provideVariables($template);

        return $bindings;
    }
}