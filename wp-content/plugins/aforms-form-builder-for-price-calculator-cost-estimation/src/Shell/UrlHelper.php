<?php

namespace AForms\Shell;

class UrlHelper 
{
    protected $nonceName;
    protected $baseUrl;

    public function __construct($nonceName, $baseUrl) 
    {
        $this->nonceName = $nonceName;
        $this->baseUrl = $baseUrl;
    }

    public function getNonceName() 
    {
        return $this->nonceName;
    }

    public function ajax($action, $path0 = null) 
    {
        if (is_null($path0)) {
            $path0 = array();
        }
        $path = join('_', $path0);
        $bareUrl = admin_url('admin-ajax.php').'?action='.urlencode($action);
        if ($path) {
            $bareUrl .= '&path='.urlencode($path);
        }
        $x = wp_nonce_url($bareUrl, $action, $this->nonceName);
        return str_replace('&amp;', '&', $x);
    }

    public function asset($path) 
    {
        return $this->baseUrl . $path;
    }

    public function adminPage($page, $path0 = null) 
    {
        if (is_null($path0)) {
            $path0 = array();
        }
        $path = join('_', $path0);
        $bareUrl = admin_url('/admin.php').'?page='.urlencode($page);
        if ($path) {
            $bareUrl .= '&path='.urlencode($path);
        }
        return $bareUrl;
    }
}