<?php

namespace AForms\Domain;

class InputProcessor 
{
    use Lib;
    
    const EMAIL_PATTERN = '/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/';
    const TEL_PATTERN = '/^[0-9-]+$/';

    protected $scorer;
    protected $options;
    protected $rule;
    protected $word;
    protected $warnings;

    public function __construct($scorer, $options, $rule, $word) 
    {
        $this->scorer = $scorer;
        $this->options = $options;
        $this->rule = $rule;
        $this->word = $word;
        $this->warnings = array();
    }

    protected function error($message) 
    {
        // TODO: throw domain exception
        throw new \RuntimeException($message);
    }

    protected function notAuthorized($score, $token)
    {
        throw new OrderException('score: '.$score.' '.$token);
    }

    protected function satisfied($set, $specs) 
    {
        foreach ($specs as $name => $value) {
            if ($value != property_exists($set, $name)) {
                return false;
            }
        }
        return true;
    }

    protected function extend($set, $specs) 
    {
        foreach ($specs as $name => $value) {
            if ($value) {
                $set->{$name} = true;
            } else {
                unset($set->{$name});
            }
        }
    }

    protected function compare($price, $equation, $threshold) 
    {
        switch ($equation) {
            case 'equal': 
                return $price == $threshold;
            case 'notEqual': 
                return $price != $threshold;
            case 'greaterThan': 
                return $price > $threshold;
            case 'greaterEqual': 
                return $price >= $threshold;
            case 'lessThan': 
                return $price < $threshold;
            case 'lessEqual': 
                return $price <= $threshold;
        }
    }

    protected function compare2($price, $lower, $lowerIncluded, $higher, $higherIncluded) 
    {
        if (! is_null($lower)) {
            if ($lowerIncluded) {
                if ($price < $lower) {
                    return false;
                }
            } else {
                if ($price <= $lower) {
                    return false;
                }
            }
        }
        if (! is_null($higher)) {
            if ($higherIncluded) {
                if ($price > $higher) {
                    return false;
                }
            } else {
                if ($price >= $higher) {
                    return false;
                }
            }
        }
        return true;
    }

    protected function findByProp($name, $value, $arr) 
    {
        foreach ($arr as $e) {
            if ($e->{$name} == $value) {
                return $e;
            }
        }
        return null;
    }

    protected function findQuantity($data, $qid, $items, $labels, $env) 
    {
        // invariant: $data->{$qid} exists
        if ($qid == -1) {
            return 1;
        }
        $item = $this->findByProp("id", $qid, $items);
        if ($item->type == 'Quantity' || $item->type == 'Slider') {
            if (! $this->satisfied($labels, $item->depends)) {
                return null;
            }
            // データのチェック
            if (! property_exists($data, "".$qid)) return 0;
            $value = $data->{$qid};
            if (! is_numeric($value)) return 0;
            return $value;
        } else if ($item->type == 'AutoQuantity') {
            return property_exists($env, "".$qid) ? $env->{"".$qid} : null;
        }
    }

    protected function isSelectorEnabled($options, $labels) 
    {
        foreach ($options as $option) {
            if ($this->satisfied($labels, $option->depends)) {
                return true;
            }
        }
        return false;
    }

    protected function guard($val) 
    {
        if (is_infinite($val) || is_nan($val)) {
            throw new EvaluationException('evaluation error: overflow in %s');
        }
        return $val;
    }

    protected function evl($ast, $ctx) 
    {
        if (is_numeric($ast)) {  // literal
            return $ast;
        } else if (is_string($ast)) {  // variable lookup
            $v = $this->findByProp('sym', $ast, $ctx->vars);
            if (! $v) {
                throw new EvaluationException('evaluation error: no-variable in %s');
            }
            if ($v->ref == -1) return $ctx->total;
            $q = +$this->findQuantity($ctx->data, $v->ref, $ctx->items, $ctx->labels, $ctx->env);
            if ($q === null) {
                throw new EvaluationException('evaluation error: no-quantity in %s');
            }
            return $q;
        } else if (is_array($ast)) {  // function application
            switch ($ast[0]) {
                case '+': 
                    return $this->guard($this->evl($ast[1], $ctx) + $this->evl($ast[2], $ctx));
                case '-': 
                    return $this->guard($this->evl($ast[1], $ctx) - $this->evl($ast[2], $ctx));
                case '*': 
                    return $this->guard($this->evl($ast[1], $ctx) * $this->evl($ast[2], $ctx));
                case '/': 
                    $b = $this->evl($ast[2], $ctx);
                    if ($b == 0) throw new EvaluationException('evaluation error: undefined-calculation in %s');
                    return $this->guard($this->evl($ast[1], $ctx) / $b);
                case '^': 
                    return $this->guard($this->evl($ast[1], $ctx) ** $this->evl($ast[2], $ctx));
                case 'IFERROR': 
                    try {
                        return $this->evl($ast[1], $ctx);
                    } catch (EvaluationException $_ex) {
                        return $this->evl($ast[2], $ctx);
                    }
                case 'ROUND': 
                    $a = $this->evl($ast[1], $ctx);
                    $b = pow(10, $this->trunc($this->evl($ast[2], $ctx)));
                    return $this->guard(round($a * $b) / $b);
                case 'ROUNDUP':  // align to +- infinity
                    $a = $this->evl($ast[1], $ctx);
                    $b = pow(10, $this->trunc($this->evl($ast[2], $ctx)));
                    $c = $a * $b;
                    return $this->guard(($c < 0 ? floor($c) : ceil($c)) / $b);
                case 'ROUNDDOWN':  // align to zero
                    $a = $this->evl($ast[1], $ctx);
                    $b = pow(10, $this->trunc($this->evl($ast[2], $ctx)));
                    return $this->guard($this->trunc($a * $b) / $b);
                case 'TRUNC':  // align to zero
                    $a = $this->evl($ast[1], $ctx);
                    $b0 = count($ast) == 3 ? $this->trunc($this->evl($ast[2], $ctx)) : 0;
                    $b = pow(10, $b0);
                    return $this->guard($this->trunc($a * $b) / $b);
                case 'INT':  // align to negative infinity
                    $a = $this->evl($ast[1], $ctx);
                    return $this->guard(floor($a));
                case 'ABS': 
                    $a = $this->evl($ast[1], $ctx);
                    return $this->guard($a < 0 ? -1 * $a : $a);
                case 'SIGN': 
                    $a = $this->evl($ast[1], $ctx);
                    return $this->guard($a < 0 ? -1 : ($a > 0 ? 1 : 0));
                case 'QUOTIENT':  // align to zero
                    $b = $this->evl($ast[2], $ctx);
                    if ($b == 0) throw new EvaluationException('evaluation error: undefined-calculation in %s');
                    return $this->guard($this->trunc($this->evl($ast[1], $ctx) / $b));
                case 'MOD':  // MOD(n, d) == n - d * INT(n / d)
                    $d = $this->evl($ast[2], $ctx);
                    if ($d == 0) throw new EvaluationException('evaluation error: undefined-calculation in %s');
                    $n = $this->evl($ast[1], $ctx);
                    return $this->guard($n - $d * floor($n/$d));
                case 'MIN': 
                    $a = $this->evl($ast[1], $ctx);
                    $len = count($ast);
                    for ($i = 2; $i < $len; $i++) {
                        $b = $this->evl($ast[$i], $ctx);
                        if ($b < $a) $a = $b;
                    }
                    return $a;
                case 'MAX': 
                    $a = $this->evl($ast[1], $ctx);
                    $len = count($ast);
                    for ($i = 2; $i < $len; $i++) {
                        $b = $this->evl($ast[$i], $ctx);
                        if ($b > $a) $a = $b;
                    }
                    return $a;
                case 'SWITCH': 
                    $a = $this->evl($ast[1], $ctx);
                    $i = 2;
                    $len = count($ast);
                    for (; $i < $len - 1; $i += 2) {
                        $b = $this->evl($ast[$i], $ctx);
                        if ($a == $b) return $this->evl($ast[$i + 1], $ctx);
                    }
                    if ($i != $len) {
                        // there is an else clause
                        return $this->evl($ast[$i], $ctx);
                    } else {
                        throw new EvaluationException('evaluation error: no matching clause in %s');
                    }
                default: 
                    throw new EvaluationException('evaluation error: no-function in %s');
            }
        } else {  // unknown
            throw new EvaluationException('evaluation error: unknown-term in %s');
        }
    }

    protected function evalExpr($ast, $vars, $total, $data, $items, $labels, $env, $expr) 
    {
        if (is_numeric($ast) && ! is_nan($ast)) {
            // common easy case
            return $ast;
        }
        try {
            $ctx = (object)array(
                'vars' => $vars, 
                'total' => $total, 
                'data' => $data, 
                'items' => $items, 
                'labels' => $labels, 
                'env' => $env
            );
            return $this->evl($ast, $ctx);
        } catch (EvaluationException $ex) {
            $msg = sprintf($this->options->translate($ex->getMessage(), -1), $expr);
            $this->warnings[] = $msg;
        }
        return NAN;
    }

    protected function createDetail($category, $name, $quantity, $unitPrice, $taxRate = null) 
    {
        $detail = new \stdClass();
        $detail->category = $category;
        $detail->name = $name;
        $detail->quantity = $quantity;
        $detail->unitPrice = $unitPrice;
        $detail->taxRate = $taxRate;
        $detail->price = $this->normalizePrice($this->rule, $unitPrice * $quantity);
        return $detail;
    }

    public function calculateDetails($items, $data) 
    {
        $labels = new \stdClass();
        $details = array();
        $total = 0;
        $effectiveTotal = 0;
        $env = new \stdClass();

        foreach ($items as $item) {
            if ($item->type == 'Selector') {
                if (! property_exists($data, $item->id)) {
                    // the item is not selected
                    if (! $this->isSelectorEnabled($item->options, $labels)) {
                        // that is ok, no details, no labels
                        continue;
                    } else if (! $item->multiple) {
                        // that is bad
                        $this->error('item not selected: '.$item->id);
                    } else {
                        // that is ok. no details, no labels
                        continue;
                    }
                }
                $selectedOptions = $data->{$item->id};
                foreach ($item->options as $option) {
                    if (! property_exists($selectedOptions, $option->id)) {
                        continue;
                    }
                    if (! $this->satisfied($labels, $option->depends)) {
                        // the option is selected, but its dependency is not met. Just ignore
                        continue;
                    }
                    $quantity0 = $this->findQuantity($data, $item->quantity, $items, $labels, $env);
                    $quantity = $option->type == 'Option' ? $quantity0 
                        : $quantity0 * $selectedOptions->{$option->id};
                    if (is_null($quantity)) {
                        continue;
                    }
                    $this->extend($labels, $option->labels);
                    if (! is_numeric($option->price)) {
                        continue;
                    }
                    $details[] = $this->createDetail($item->name, $option->name, $quantity, $option->price, $option->taxRate);
                    $price = $this->normalizePrice($this->rule, $option->price * $quantity);
                    $total += $price;
                    $effectiveTotal += $price;
                }
            } else if ($item->type == 'Auto') {
                if (! $this->satisfied($labels, $item->depends)) {
                    // auto is not available
                    continue;
                }
                $quantity = $this->findQuantity($data, $item->quantity, $items, $labels, $env);
                if (is_null($quantity)) {
                    continue;
                }
                $unitPrice = $this->evalExpr($item->priceAst, $item->priceVars, $effectiveTotal, $data, $items, $labels, $env, $item->price);
                if (is_nan($unitPrice)) {
                    continue;
                }
                $details[] = $this->createDetail($item->category, $item->name, $quantity, $unitPrice, $item->taxRate);
                $price = $this->normalizePrice($this->rule, $unitPrice * $quantity);
                $total += $price;
                $effectiveTotal += $price;
            } else if ($item->type == 'Adjustment') {
                if (! $this->satisfied($labels, $item->depends)) {
                    // adjustment is not available
                    continue;
                }
                $quantity = $this->findQuantity($data, $item->quantity, $items, $labels, $env);
                if (is_null($quantity)) {
                    continue;
                }
                $unitPrice = $this->evalExpr($item->priceAst, $item->priceVars, $effectiveTotal, $data, $items, $labels, $env, $item->price);
                if (is_nan($unitPrice)) {
                    continue;
                }
                $details[] = $this->createDetail($item->category, $item->name, $quantity, $unitPrice, $item->taxRate);
                $price = $this->normalizePrice($this->rule, $unitPrice * $quantity);
                $total += $price;
            } else if ($item->type == 'PriceWatcher') {
                if (! $this->compare2($effectiveTotal, $item->lower, $item->lowerIncluded, $item->higher, $item->higherIncluded)) {
                    // pricewatcher is not available
                    continue;
                }
                $this->extend($labels, $item->labels);
            } else if ($item->type == 'QuantityWatcher') {
                if ($item->target == -1) {
                    // quantitywatcher is not available
                    continue;
                }
                $value = $this->findQuantity($data, $item->target, $items, $labels, $env);
                if (is_null($value)) {
                    continue;
                }
                if (! $this->compare2($value, $item->lower, $item->lowerIncluded, $item->higher, $item->higherIncluded)) {
                    // quantitywatcher is not available
                    continue;
                }
                $this->extend($labels, $item->labels);
            } else if ($item->type == 'Quantity') {
                if (! $this->satisfied($labels, $item->depends)) {
                    // quantity is not available
                    continue;
                }
                $quantity = $data->{$item->id};
                if (! $item->allowFraction && ! is_int($quantity)) {
                    // quantity not-int
                    $this->error('quantity not-int: ', $item->id);
                }
                if ($item->minimum !== null && $item->minimum !== "" && $quantity < $item->minimum || 
                    $item->maximum !== null && $item->maximum !== "" && $quantity > $item->maximum) {
                    // quantity is out of range
                    $this->error('quantity out-of-range: ', $item->id);
                }
            } else if ($item->type == 'Slider') {
                if (! $this->satisfied($labels, $item->depends)) {
                    // slider is not available
                    continue;
                }
                $quantity = $data->{$item->id};
                if (! is_numeric($quantity)) {
                    // slider not numeric
                    $this->error('slider not-numeric: ', $item->id);
                }
                if ($quantity < $item->minimum || $item->maximum < $quantity) {
                    // slider is out of range
                    $this->error('slider out-of-range: ', $item->id);
                }
            } else if ($item->type == 'AutoQuantity') {
                $q = $this->evalExpr($item->quantityAst, $item->quantityVars, $effectiveTotal, $data, $items, $labels, $env, $item->quantity);
                if (is_null($q)) {
                    continue;
                }
                $env->{"".$item->id} = $q;
            } else if ($item->type == 'Stop') {
                if ($this->satisfied($labels, $item->depends)) {
                    // Stop condition
                    $this->error('invalid submission ', $item->id);
                }
            }
        }

        return array($labels, $details, $total);
    }

    public function checkAttrs($items, $data, $form) 
    {
        $condition = new \stdClass();

        foreach ($items as $item) {
            $val = $data->{$item->id};
            if ($item->type == 'reCAPTCHA3') {
                if ($item->siteKey && $item->secretKey) {
                    $scorer = $this->scorer;
                    $score = $scorer($val, $item->secretKey, $item->action);
                    if ($score === false) {
                        $this->error('invalid captcha: '.$item->id);
                    }
                    if ($item->threshold2 > $score) {
                        $this->notAuthorized($score, $val);
                    }
                    if ($item->threshold1 > $score) {
                        $data->{$item->id} = sprintf('Soft-Pass (%01.1f)', $score);
                        $condition->softPass = true;
                    } else {
                        $data->{$item->id} = sprintf('Pass (%01.1f)', $score);
                    }
                } else {
                    // siteKeyのみ設定されている場合はトークンが送られてくる。それをクリア
                    $data->{$item->id} = '';
                }
                continue;
            }
            if ($item->required && $val == "") {
                $this->error('required but empty: '.$item->id);
            } else if (! $item->required && $val == "") {
                continue;
            }
            switch ($item->type) {
                case "Name": 
                    // no extra validation
                    break;
                case "Email": 
                    if (! preg_match(self::EMAIL_PATTERN, $val)) {
                        $this->error('invalid email: '.$item->id);
                    }
                    break;
                case "Tel": 
                    // no localized validation because I am lazy.
                    if (! preg_match(self::TEL_PATTERN, $val)) {
                        $this->error('invalid tel: '.$item->id);
                    }
                    break;
                case "Address": 
                    // no extra validation
                    // no zip validation because I am lazy.
                    break;
                case "Checkbox": 
                    if ($val != $this->word['Checked']) {
                        $this->error('invalid checkbox: '.$item->id);
                    }
                    break;
                case "Radio": 
                    if (! in_array($val, $item->options)) {
                        $this->error('invalid radio: '.$item->id);
                    }
                    break;
                case "Dropdown": 
                    if (! in_array($val, $item->options)) {
                        $this->error('invalid dropdown: '.$item->id);
                    }
                    break;
                case 'MultiCheckbox': 
                    foreach ($val as $v) {
                        if (! in_array($v, $item->options)) {
                            $this->error('invalid multicheckbox: '.$item->id);
                        }
                    }
                    break;
                case 'File': 
                    $error = $this->options->validateFiles('', $val, $item, $form);
                    if ($error) {
                        $this->error('ext: '.$error.': '.$item->id);
                    }
                    break;
                case "Text": 
                    // no extra validation
                    break;
            }
        }
        return $condition;
    }

    public function calculateAttrs($items, $data, $form) 
    {

        $attrs = array();

        foreach ($items as $item) {
            $attr = new \stdClass();
            $attr->type = $item->type;
            if ($item->type == 'reCAPTCHA3') {
                $attr->name = $this->options->translate('reCAPTCHA Result', $form->id);
            } else {
                $attr->name = $item->name;
            }
            $attr->value = $data->{$item->id};
            $attr = $this->options->extendOrderAttr($attr, $item, $form);
            $attrs[] = $attr;
        }

        return $attrs;
    }

    public function fillTotal($order, $details) 
    {
        $subtotal = 0;
        $subtotals = array();

        foreach ($details as $detail) {
            $price = $detail->price;
            $subtotal += $price;
            if (! $this->rule->taxIncluded) {
                $key = $detail->taxRate === null ? "" : "".$detail->taxRate;
                if (isset($subtotals[$key])) {
                    $subtotals[$key] += $price;
                } else {
                    $subtotals[$key] = $price;
                }
            }
        }

        if ($this->rule->taxIncluded) {
            $order->total = $subtotal;
        } else {
            $taxes = array();
            $total = $subtotal;
            foreach ($subtotals as $key => $st) {
                $taxRate = $key === "" ? $this->rule->taxRate : $key;
                $tax = $this->normalizePrice($this->rule, $st * $taxRate * 0.01);
                $taxes[$key] = $tax;
                $total += $tax;
            }
            $order->subtotal = $subtotal;
            $order->defaultTaxRate = $this->rule->taxRate;
            $order->taxes = $taxes;
            $order->total = $total;
        }

        return $order;
    }

    protected function fillCurrency($order) 
    {
        list($pricePrefix, $priceSuffix) = explode('%s', $this->word['$%s']);
        $order->currency = (object)array(
            'taxPrecision' => $this->rule->taxPrecision, 
            'pricePrefix' => $pricePrefix, 
            'priceSuffix' => $priceSuffix, 
            'decPoint' => $this->word['.'], 
            'thousandsSep' => $this->word[',']
        );
    }

    public function __invoke($form, $data) 
    {
        // one-path validation and calculation
        list($labels, $details, $total) = $this->calculateDetails($form->detailItems, $data->details);

        // validation
        $condition = $this->checkAttrs($form->attrItems, $data->attrs, $form);

        // create order
        $attrs = $this->calculateAttrs($form->attrItems, $data->attrs, $form);

        $order = new \stdClass();
        $order->id = null;
        $order->formId = $form->id;
        $order->formTitle = $form->title;
        $order->customer = null;
        $order->created = time();
        $order->details = $details;
        $order->attrs = $attrs;
        $order->condition = $condition;
        $this->fillTotal($order, $details);
        $this->fillCurrency($order);
        
        return $order;
    }

    public function hasWarnings() 
    {
        return count($this->warnings) > 0;
    }

    public function composeWarnings() 
    {
        $ls = array();
        foreach ($this->warnings as $w) {
            $ls[] = '- ' . $this->options->translate($w, -1);
        }
        return join("\n", $ls);
    }
}