<?php

namespace AForms\Infra;

/**
 * For Test.
 */
class ConstScorer 
{
    protected $score;

    public function __construct($score) 
    {
        $this->score = $score;
    }

    public function __invoke($token, $secretKey, $action) 
    {
        return $this->score;
    }
}