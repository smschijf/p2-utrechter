<?php

namespace AForms\Domain;

class FormProcessor 
{
    // set to comma-separated-fields
    protected function decompileSet($set) 
    {
        if (! $set) {
            return '';
        }
        $terms = array();
        foreach (get_object_vars($set) as $k => $v) {
            if ($v) {
                $terms[] = $k;
            } else {
                $terms[] = '!'.$k;
            }
        }
        return join(', ', $terms);
    }

    // comma-separated-fields to set
    protected function compileSet($csv) 
    {
        $set = new \stdClass();
        if (! $csv) {
            return $set;
        }

        $fields = explode(',', $csv);
        foreach ($fields as $field) {
            $field = trim($field);
            if (substr($field, 0, 1) == '!') {
                $set->{substr($field, 1)} = false;
            } else {
                $set->{$field} = true;
            }
        }
        return $set;
    }

    // string[] to comma-separated-fields
    protected function decompileStrings($strs) 
    {
        if (! $strs) {
            return '';
        }
        return join(', ', $strs);
    }

    // comma-separated-fields to string[]
    protected function compileStrings($csv) 
    {
        $ss = array();
        if (! $csv) {
            return $ss;
        }

        $fields = explode(',', $csv);
        foreach ($fields as $field) {
            $field = trim($field);
            $ss[] = $field;
        }
        return $ss;
    }

    // vdom to html
    protected function decompileVdom($vdom) 
    {
        if (is_null($vdom)) {
            return '';
        
        } else if (is_string($vdom)) {
            return $vdom;
        
        } else if (is_array($vdom)) {
            $content = '';
            foreach ($vdom as $child) {
                $content .= $this->decompileVdom($child);
            }
            return $content;

        } else if (is_object($vdom)) {
            $attrs = '';
            foreach (get_object_vars($vdom->attributes) as $name => $value) {
                if (is_bool($value)) {
                    if ($value) {
                        $attrs .= sprintf(' %s', $name);
                    }
                } else {
                    $attrs .= sprintf(' %s="%s"', $name, $value);
                }
            }
            $content = '';
            foreach ($vdom->children as $child) {
                $content .= $this->decompileVdom($child);
            }

            return sprintf('<%s%s>%s</%s>', 
                           $vdom->nodeName, 
                           $attrs, 
                           $content, 
                           $vdom->nodeName);
        }
    }

    protected function convertNode($node) 
    {
        switch ($node->nodeType) {
            case XML_TEXT_NODE: 
                return $node->textContent;
            
            case XML_ELEMENT_NODE: 
                $attrMap = new \stdClass();
                foreach ($node->attributes as $attr) {
                    if ($attr->name == $attr->value) {
                        $attrMap[$attr->name] = true;
                    } else {
                        $attrMap->{$attr->name} = $attr->value;
                    }
                }
                $children = array();
                for ($c = $node->firstChild; $c != null; $c = $c->nextSibling) {
                    $children[] = $this->convertNode($c);
                }
                $rv = new \stdClass();
                $rv->nodeName = $node->tagName;
                $rv->attributes = $attrMap;
                $rv->children = $children;
                return $rv;
            
            default: 
                return $node->textContent;
        }
    }

    // html to vdom
    protected function compileVdom($html) 
    {
        $html = '<html><body>'.$html.'</body></html>';
        $doc = new \DOMDocument();
        //$options = LIBXML_HTML_NOIMPLIED|LIBXML_HTML_NODEFDTD|LIBXML_NONET|LIBXML_NOWARNING;
        $options = LIBXML_NONET|LIBXML_NOWARNING;
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        $flag = libxml_use_internal_errors(true);
        if (! $doc->loadHTML($html, $options)) {
            libxml_clear_errors();
            libxml_use_internal_errors($flag);
            throw new \RuntimeException('html parsing failure');
        }
        libxml_clear_errors();
        libxml_use_internal_errors($flag);
        $node = $doc->documentElement;

        $vdom = $this->convertNode($node);
        return $vdom->children[0]->children;
    }

    public function decompile($form, $extRepo) 
    {
        foreach ($form->detailItems as $item) {
            switch ($item->type) {
                case 'Auto':  /* thru */
                case 'Adjustment': /* thru */
                case 'Stop': 
                    $item->depends = $this->decompileSet($item->depends);
                    break;
                case 'Selector': 
                    $item->note = $this->decompileVdom($item->note);
                    foreach ($item->options as $option) {
                        // Option or QuantOption
                        $option->labels = $this->decompileSet($option->labels);
                        $option->depends = $this->decompileSet($option->depends);
                        $option->note = $this->decompileVdom($option->note);
                    }
                    break;
                case 'PriceWatcher': /* thru */
                case 'QuantityWatcher': 
                    $item->labels = $this->decompileSet($item->labels);
                    break;
                case 'Quantity': /* thru */
                case 'Slider': 
                    $item->note = $this->decompileVdom($item->note);
                    $item->depends = $this->decompileSet($item->depends);
                    break;
                case 'AutoQuantity': 
                    break;
            }
        }

        // removes extension-powered items
        $fileEnabled = $extRepo->testRole('file');
        $attrItems = array();
        foreach ($form->attrItems as $item) {
            if (! $fileEnabled && $item->type == 'File') {
                // do nothing
            } else {
                $attrItems[] = $item;
            }
        }
        $form->attrItems = $attrItems;

        foreach ($form->attrItems as $item) {
            $item->note = $this->decompileVdom($item->note);
            switch ($item->type) {
                case 'Radio': /* thru */
                case 'Dropdown': 
                    $item->options = $this->decompileStrings($item->options);
                    break;
                case 'MultiCheckbox': 
                    $item->options = $this->decompileStrings($item->options);
                    $item->initialValue = $this->decompileStrings($item->initialValue);
                    break;
            }
        }
    }

    public function compile($form) 
    {
        foreach ($form->detailItems as $item) {
            switch ($item->type) {
                case 'Auto':  /* thru */
                case 'Adjustment':  /* thru */
                case 'Stop': 
                    $item->depends = $this->compileSet($item->depends);
                    break;
                case 'Selector': 
                    $item->note = $this->compileVdom($item->note);
                    foreach ($item->options as $option) {
                        // Option or QuantOption
                        $option->labels = $this->compileSet($option->labels);
                        $option->depends = $this->compileSet($option->depends);
                        $option->note = $this->compileVdom($option->note);
                    }
                    break;
                case 'PriceWatcher': /* thru */
                case 'QuantityWatcher': 
                    $item->labels = $this->compileSet($item->labels);
                    break;
                case 'Quantity': /* thru */
                case 'Slider': 
                    $item->note = $this->compileVdom($item->note);
                    $item->depends = $this->compileSet($item->depends);
                    break;
                case 'AutoQuantity': 
                    break;
            }
        }

        foreach ($form->attrItems as $item) {
            $item->note = $this->compileVdom($item->note);
            switch ($item->type) {
                case 'Radio':  /* thru */
                case 'Dropdown': 
                    $item->options = $this->compileStrings($item->options);
                    break;
                case 'MultiCheckbox': 
                    $item->options = $this->compileStrings($item->options);
                    $item->initialValue = $this->compileStrings($item->initialValue);
            }
        }
    }

    public function aim($form, $extRepo) 
    {
        $fileEnabled = $extRepo->testRoleForForm('file', $form);
        $attrItems = array();
        foreach ($form->attrItems as $ai) {
            if (! $fileEnabled && $ai->type == 'File') {
                // do nothing
            } else {
                $attrItems[] = $ai;
            }
        }
        $form->attrItems = $attrItems;
    }

    public function getActionSpecMap($form, $word) 
    {
        $rv = new \stdClass;
        $rv->input = array();
        $rv->confirm = array();
        
        if (count($form->attrItems) > 0) {
            if ($form->doConfirm) {
                $rv->input[] = (object)array(
                    'label' => $word['To Confirmation Screen'], 
                    'buttonType' => 'primary', 
                    'action' => 'confirm', 
                    'id' => null
                );
                $rv->confirm[] = (object)array(
                    'label' => $word['Submit'], 
                    'buttonType' => 'primary', 
                    'action' => 'submit', 
                    'id' => null
                );
            } else {
                $rv->input[] = (object)array(
                    'label' => $word['Submit'], 
                    'buttonType' => 'primary', 
                    'action' => 'submit', 
                    'id' => null
                );
            }
        }

        return $rv;
    }

    public function getResponseSpec($form, $order, $word) 
    {
        if ($form->thanksUrl) {
            return (object)array(
                'action' => 'open', 
                'data' => $form->thanksUrl, 
                'clearLoading' => false, 
                'option' => null
            );
        } else {
            return (object)array(
                'action' => 'show', 
                'data' => $word['The form has been successfully submitted.'], 
                'clearLoading' => false, 
                'option' => null
            );
        }
    }

    public function getCustomResponseSpec() 
    {
        return (object)array(
            'action' => 'none', 
            'data' => null, 
            'clearLoading' => false, 
            'option' => null
        );
    }
}