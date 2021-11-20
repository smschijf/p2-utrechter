<?php

namespace AForms\Shell;

use Aura\Payload\Payload;
use Aura\Di\ContainerBuilder;

class Dispatcher 
{
    protected $container;
    protected $urlHelper;
    protected $adminPages;  // page -> {pointer, types, template}[]
    protected $shortcodes;  // name -> {pointer, types, template}[]
    protected $ajaxes;      // action -> {pointer, types}[]

    public static function newInstance($configs) 
    {
        $builder = new ContainerBuilder();
        $container = $builder->newConfiguredInstance($configs);
        return new Dispatcher($container, $container->get('urlHelper'));
    }

    public function __construct($container, $urlHelper) 
    {
        $this->container = $container;
        $this->urlHelper = $urlHelper;
        $this->adminPages = array();
        $this->shortcodes = array();
        $this->ajaxes = array();
    }

    public function getService($name) 
    {
        return $this->container->get($name);
    }

    protected function call($pointer, $args) 
    {
        if ($pointer) {
            $object = $this->container->newInstance($pointer);
            return call_user_func_array($object, $args);
        } else {
            return null;
        }
    }

    public function addAdmin($page, $template, $types = null, $pointer = null) 
    {
        if (is_null($types)) {
            $types = array();
        }
        if (! isset($this->adminPages[$page])) {
            $this->adminPages[$page] = array();
        }
        $this->adminPages[$page][] = (object)array('pointer' => $pointer, 'types' => $types, 'template' => 'admin/'.$template);
    }

    public function addShort($name, $template, $types = null, $pointer = null) 
    {
        if (is_null($types)) {
            $types = array();
        }
        if (! isset($this->shortcodes[$name])) {
            $this->shortcodes[$name] = array();
        }
        $this->shortcodes[$name][] = (object)array('pointer' => $pointer, 'template' => 'front/'.$template, 'types' => $types);
    }

    public function addAjax($action, $types = null, $pointer = null) 
    {
        if (is_null($types)) {
            $types = array();
        }
        if (! isset($this->ajaxes[$action])) {
            $this->ajaxes[$action] = array();
        }
        $this->ajaxes[$action][] = (object)array('pointer' => $pointer, 'types' => $types);
    }

    public function install() 
    {
        $payload = new Payload();
        $args = array($payload);
        return $this->call('AForms\App\Admin\Install', $args);
    }

    // browser GET.  there params, no inputs, outputs html
    public function adminPage() 
    {
        $page = $_REQUEST['page'];
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : null;
        list($adminPage, $args) = $this->match($path, $this->adminPages[$page]);
        $pointer = $adminPage->pointer;
        $input = null;
        $payload = new Payload();
        $payload->setInput($input);
        $args[] = $input;
        $args[] = $payload;

        $payload = $this->call($pointer, $args);

        $r = $this->container->newInstance('AForms\Shell\HtmlResponder');
        $r->setEcho(true);
        $r($adminPage->template, $payload);
    }

    // browser GET.  there params, there inputs, outputs html
    public function shortcode($atts, $content, $name) 
    {
        if (isset($atts['path'])) {
            $path = $atts['path'];
            unset($atts['path']);
        } else {
            $path = null;
        }
        list($shortcode, $args) = $this->match($path, $this->shortcodes[$name]);
        $pointer = $shortcode->pointer;
        $input = (object)$atts;
        $payload = new Payload();
        $payload->setInput($input);
        $args[] = $input;
        $args[] = $payload;

        $payload = $this->call($pointer, $args);

        $r = $this->container->newInstance('AForms\Shell\HtmlResponder');
        $r->setEcho(false);
        $out = $r($shortcode->template, $payload);
        return $out;
    }

    protected function getAjaxInput() 
    {
        switch ($_SERVER['REQUEST_METHOD']) {
            case 'POST': 
            case 'PUT': 
            case 'PATCH': 
                if ($_SERVER['CONTENT_TYPE'] == 'application/json') {
                    $input = json_decode(file_get_contents('php://input'));
                } else {
                    $input = null;
                }
                break;
            case 'GET': 
            case 'HEAD': 
            case 'DELETE': 
                $arr = $_GET;
                unset($arr['action']);
                unset($arr['path']);
                $input = json_decode(json_encode($arr), false);
                break;
            default: 
                $input = null;
        }
        return $input;
    }

    // ajax.  there params, there inputs, outputs json
    public function ajax() 
    {
        $action = $_REQUEST['action'];
        check_ajax_referer($action, $this->urlHelper->getNonceName());
        $path = isset($_REQUEST['path']) ? $_REQUEST['path'] : null;
        list($ajax, $args) = $this->match($path, $this->ajaxes[$action]);

        $pointer = $ajax->pointer;
        $input = $this->getAjaxInput();
        $payload = new Payload();
        $payload->setInput($input);
        $args[] = $input;
        $args[] = $payload;

        $payload = $this->call($pointer, $args);

        $rclass = 'AForms\Shell\JsonResponder';
        $r = $this->container->newInstance($rclass);
        $r->setEcho(true);
        $r($payload);
    }

    protected function match($path, $specs) 
    {
        foreach ($specs as $spec) {
            $params = $this->parsePath($path, $spec->types);
            if (! is_null($params)) {
                return array($spec, $params);
            }
        }
        $this->abort('no matching handler');
    }

    protected function parsePath($path, $types) 
    {
        if (! $path) {
            $params = array();
        } else {
            $params = explode('_', $path);
        }
        if (count($params) != count($types)) {
            // parameter count mismatch
            return null;
        }
        $len = count($params);
        for ($i = 0; $i < $len; $i++) {
            switch ($types[$i]) {
                case 'int': 
                    $params[$i] = intval($params[$i]);
                    break;
                case 'bool': 
                    $params[$i] = ($params[$i] == 'T') ? true : false;
                    break;
                case 'string': 
                    break;
                default: 
                    if ($params[$i] != $types[$i]) {
                        // keyword mismatch
                        return null;
                    }
                    break;
            }
        }
        return $params;
    }

    protected function abort($message) 
    {
        echo "ERROR: ".$message;
        wp_die();
    }
}