<?php

namespace AForms\Infra;

class RuleMapper 
{
    const KEY = 'wp_quote_settings';

    protected $wpdb;

    public function __construct($wpdb) 
    {
        $this->wpdb = $wpdb;
    }

    public function load() 
    {
        $default = json_encode((object)array(
            'taxIncluded' => false, 
            'taxRate' => 8, 
            'taxNormalizer' => 'trunc', 
            'taxPrecision' => 0
        ));
        $option = get_option(self::KEY, $default);
        return json_decode($option, false);
    }

    public function save($settings) 
    {
        update_option(self::KEY, json_encode($settings));
    }
}