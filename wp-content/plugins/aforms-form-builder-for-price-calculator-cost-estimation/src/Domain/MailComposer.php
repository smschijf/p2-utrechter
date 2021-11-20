<?php

namespace AForms\Domain;

class MailComposer 
{
    use Lib;

    const EOL = "\n";
    protected $session;
    protected $rule;
    protected $word;
    protected $options;

    public function __construct($session, $rule, $word, $options) 
    {
        $this->session = $session;
        $this->rule = $rule;
        $this->word = $word;
        $this->options = $options;
    }

    protected function showDetailText($order) 
    {
        $precision = $this->rule->taxPrecision;
        $lines = array();

        $format = $this->word['%s (x %s) %s %s'];

        foreach ($order->details as $item) {
            $price = $this->showPrice($order->currency, $item->price);
            if ($this->rule->taxIncluded) {
                $taxInfo = '';
            } else if ($item->taxRate === null) {
                $taxInfo = sprintf($this->word['(common %s%% applied)'], "".$this->rule->taxRate);
            } else {
                $taxInfo = sprintf($this->word['(%s%% applied)'], "".$item->taxRate);
            }
            $lines[] = sprintf($format, $item->name, $item->quantity, $price, $taxInfo);
        }

        return implode(self::EOL, $lines);
    }

    protected function showTotalText($order) 
    {
        $precision = $this->rule->taxPrecision;
        $lines = array();

        $format = $this->word['%s: %s'];
        
        if (property_exists($order, "subtotal")) {
            // tax excluded
            $subtotal = $this->showPrice($order->currency, $order->subtotal);
            $lines[] = sprintf($format, $this->word['Subtotal'], $subtotal);
            if (isset($order->taxes[''])) {
                $tax = $this->showPrice($order->currency, $order->taxes['']);
                $label = sprintf($this->word['Tax (common %s%%)'], "".$order->defaultTaxRate);
                $lines[] = sprintf($format, $label, $tax);
            }
            foreach ($order->taxes as $key => $amount) {
                if ($key === "") continue;
                $tax = $this->showPrice($order->currency, $amount);
                $label = sprintf($this->word['Tax (%s%%)'], "".$key);
                $lines[] = sprintf($format, $label, $tax);
            }
            $total = $this->showPrice($order->currency, $order->total);
            $lines[] = sprintf($format, $this->word['Total'], $total);
        } else {
            // tax included
            $total = $this->showPrice($order->currency, $order->total);
            $lines[] = sprintf($format, $this->word['Total'], $total);
        }

        return implode(self::EOL, $lines);
    }

    protected function showAttrText($order, $forClient) 
    {
        $lines = array();
        $format = $this->word["== %s ==\n%s"];
        
        foreach ($order->attrs as $item) {
            if ($item->type == 'reCAPTCHA3' && $forClient) {
                // 顧客に送るメールにはreCAPTCHA3の結果は記載しない。
                continue;
            } else if ($item->type == 'MultiCheckbox') {
                $glue = $this->word[', '];
                $value = implode($glue, $item->value);
                $lines[] = sprintf($format, $item->name, $value);
            } else if ($item->type == 'File') {
                $glue = $this->word[', '];
                $names = array();
                foreach ($item->value as $f) {
                    $names[] = $f->name;
                }
                $value = implode($glue, $names);
                $lines[] = sprintf($format, $item->name, $value);
            } else {
                $lines[] = sprintf($format, $item->name, $item->value);
            }
        }

        return implode(self::EOL, $lines);
    }

    public function __invoke($order, $template, $forClient) 
    {
        $ps = array('{{id}}', '{{details}}', '{{total}}', '{{attributes}}', '{{name}}', '{{email}}');
        $rs = array($order->id, $this->showDetailText($order), $this->showTotalText($order), $this->showAttrText($order, $forClient), $this->findAttrByType($order, 'Name'), $this->findAttrByType($order, 'Email'));
        return str_replace($ps, $rs, $template);
    }

    public function findAttrByType($order, $type) 
    {
        foreach ($order->attrs as $attr) {
            if ($attr->type == $type) {
                return $attr->value;
            }
        }
        return null;
    }
}