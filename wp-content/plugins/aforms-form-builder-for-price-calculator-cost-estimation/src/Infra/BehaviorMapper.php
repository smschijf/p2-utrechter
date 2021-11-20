<?php

namespace AForms\Infra;

class BehaviorMapper 
{
    const KEY = 'wp_aforms_behavior_settings';

    protected $wpdb;

    public function __construct($wpdb) 
    {
        $this->wpdb = $wpdb;
    }

    protected function getDefault() 
    {
        return json_encode((object)array(
            'smoothScroll' => true
        ));
    }

    public function load() 
    {
        $rule0 = get_option(self::KEY, $this->getDefault());
        return json_decode($rule0, false);
    }

    public function save($rule) 
    {
        update_option(self::KEY, json_encode($rule));
    }
}