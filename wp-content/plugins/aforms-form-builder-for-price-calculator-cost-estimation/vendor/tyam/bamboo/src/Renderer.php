<?php
/**
 * Renderer
 *
 * Renders a template, also provides an interface to the rendering engine for the template.
 */

namespace tyam\bamboo;

use ArrayAccess;

class Renderer
{
    private $resolve;
    private $sections;
    private $content;
    private $next;
    private $sectionStack;

    /**
     * instantiates Renderer.
     *
     * One renderer renders one template.
     *
     * @param Callable $resolve function resolves template path and template variables
     * @param ArrayAccess $sections array-like object which holds section values
     * @param string $content content from a child template, can be ''
     */
    public function __construct($resolve, $sections, $content = '')
    {
        $this->resolve = $resolve;
        $this->sections = $sections;
        $this->content = $content;
        $this->next = null;
        $this->sectionStack = [];
    }

    /**
     * renders a specified template and returns output string.
     *
     * If the template inherits/includes other templates, then instantiate the new renderer objects 
     * and renders them all.
     *
     * @param string $template path to the template to be rendered
     * @param array|null $variables template variables
     * @return string rendered content
     */
    public function render($template, $variables = null)
    {
        list($path__, $env__) = call_user_func($this->resolve, $template, $variables);
        
        $renderer = $this;
        unset($template, $variables);
        extract($env__);
        ob_start();
        require($path__);
        $output = ob_get_clean();

        if ($this->next) {
            // wrapper has been specified. Then continue wrapper with current output.
            list($template, $variables) = $this->next;
            $next = new Renderer($this->resolve, $this->sections, $output);
            return $next->render($template, $variables);
        } else {
            return $output;
        }
    }

    /**
     * Wraps the current template (child) with the specified template (parent).
     *
     * @param string $template parent template
     * @param array|null $variables template variables for parent template
     * @return void
     */
    public function wrap($template, $variables = null) 
    {
        if ($this->next) {
            // You can specify wrapper at most once.
            throw new \LogicException('specifying wrapper twice');
        }
        $this->next = [$template, $variables];
    }

    /**
     * Outputs the content produced by child template.
     *
     * @return void
     */
    public function content()
    {
        echo $this->content;
    }

    /**
     * Begin section.
     *
     * @param string $name the section name
     * @return void 
     */
    public function section($name)
    {
        array_unshift($this->sectionStack, $name);
        ob_start();
    }

    /**
     * End section.
     *
     * The `$name` parameter, if passed, is used to check section sanity.
     * When the passed name is different from the current section, then renderer throws runtime exception.
     *
     * @param string|null $name the section name
     * @return void
     */
    public function endsection($name = null)
    {
        // You can specify the section name for sanity-check purpose.
        if (! is_null($name) && $this->sectionStack[0] != $name) {
            throw new \LogicException('unmatched end-section: ' . $name . ', expects: ' . $this->sectionStack[0]);
        }

        $output = ob_get_clean();

        $name = array_shift($this->sectionStack);
        $this->sections[$name] = $output;
    }

    /**
     * Outputs the block captured by section+endsection.
     *
     * @param string $name section name to be output
     */
    public function extract($name)
    {
        if (empty($this->sections[$name])) {
            // do nothing
        } else {
            echo $this->sections[$name];
        }
    }

    /**
     * Outputs another template.
     *
     * @param string $template path to the template
     * @param array|null $variables template variables 
     */
    public function embed($template, $variables = null)
    {
        $renderer = new Renderer($this->resolve, $this->sections);
        echo $renderer->render($template, $variables);
    }
}