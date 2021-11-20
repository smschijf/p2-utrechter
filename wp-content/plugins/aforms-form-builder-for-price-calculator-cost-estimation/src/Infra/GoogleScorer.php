<?php

namespace AForms\Infra;

class GoogleScorer 
{
    const URL = 'https://www.google.com/recaptcha/api/siteverify';

    public function __invoke($token, $secretKey, $action) 
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => self::URL,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => array(
                'secret' => $secretKey, 
                'response' => $token
            ),
        ]);

        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        
        if (!$response['success'] || $response['action'] != $action) {
            return false;
        }
        return $response['score'];
    }
}