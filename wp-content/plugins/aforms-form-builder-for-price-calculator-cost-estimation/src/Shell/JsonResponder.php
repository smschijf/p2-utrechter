<?php
namespace AForms\Shell;
use Aura\Payload_Interface\PayloadStatus as Status;
class JsonResponder 
{
    protected $echo;
    public function __construct() 
    {
        $this->echo = false;
    }
    public function isEcho() 
    {
        return $this->echo;
    }
    public function setEcho($flag) 
    {
        $this->echo = $flag;
    }
    public static function codeForStatus($status) {
        switch ($status) {
            case Status::SUCCESS: return 200;
            case Status::FAILURE: return 409;
            case Status::ERROR:   return 500;
            case Status::NOT_VALID: return 400;
            case Status::NOT_AUTHENTICATED: return 401;
            case Status::NOT_AUTHORIZED: return 403;
            case Status::NOT_FOUND: return 404;
            default: return 500;
        }
    }
    public function __invoke($payload = null) 
    {
        if ($payload && $payload->getStatus() != Status::SUCCESS) {
            wp_die('Q;'.$payload->getStatus(), self::codeForStatus($payload->getStatus()));
        }
        $output = ($payload) ? $payload->getOutput() : null;
        $json = json_encode($output);
        if ($this->echo) {
            echo $json;
            wp_die();
        } else {
            return $json;
        }
    }
}