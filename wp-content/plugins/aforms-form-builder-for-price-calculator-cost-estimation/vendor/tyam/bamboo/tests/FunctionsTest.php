<?php

namespace tyam\bamboo\tests;

use PHPUnit_Framework_TestCase as TestCase;
use tyam\bamboo\Engine;

class FunctionsTest extends TestCase
{
    function testFunctions() {
        Engine::loadFunctions();
        $this->assertTrue(function_exists('eh'));
    }
}