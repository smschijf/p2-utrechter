<?php
/**
 * Provides template variables to templates.
 */

namespace tyam\bamboo;

interface VariableProvider
{
    /**
     * Fetches template variables in some way, and provides them to the template.
     *
     * @param string $template path to the target template
     * @return array template variables
     */
    public function provideVariables($template);
}