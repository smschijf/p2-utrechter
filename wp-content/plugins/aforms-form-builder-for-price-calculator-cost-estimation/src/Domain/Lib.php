<?php

namespace AForms\Domain;

trait Lib 
{
    public function normalizePrice($rule, $price) 
    {
        $price = $price * pow(10, $rule->taxPrecision);
        switch ($rule->taxNormalizer) {
            case 'floor': 
                $price = intval(floor($price));
                break;
            case 'ceil': 
                $price = intval(ceil($price));
                break;
            case 'round': 
                $price = intval(round($price));
                break;
            case 'trunc': 
                $sign = ($price < 0) ? -1 : 1;
                $price = $sign * intval(floor(abs($price)));
                break;
        }
        return $price = $price / pow(10, $rule->taxPrecision);
    }

    public function trunc($x) 
    {
        return ($x < 0) ? ceil($x) : floor($x);
    }

    public function showPrice($currency, $price) 
    {
        $priceStr = number_format($price, $currency->taxPrecision, $currency->decPoint, $currency->thousandsSep);
        return $currency->pricePrefix.$priceStr.$currency->priceSuffix;
    }

    public function showNumber($currency, $price) 
    {
        return number_format($price, $currency->taxPrecision, $currency->decPoint, $currency->thousandsSep);
    }
}