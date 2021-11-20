<?php

namespace tyam\bamboo\tests;

use PHPUnit_Framework_TestCase as TestCase;
use tyam\bamboo\Engine;
use tyam\bamboo\VariableProvider;


class BasicTest extends TestCase implements VariableProvider 
{
    private $basedirs = [
        __DIR__ . DIRECTORY_SEPARATOR . 'templates'
    ];
    private $basedirs2 = [
        __DIR__ . DIRECTORY_SEPARATOR . 'templates2', 
        __DIR__ . DIRECTORY_SEPARATOR . 'templates'
    ];

    public function testResolvePath() 
    {
        $engine = new Engine($this->basedirs);

        $this->assertEquals($engine->resolvePath('0content'), $this->basedirs[0] . DIRECTORY_SEPARATOR . '0content.php');

        try {
            $engine->resolvePath('nonexistent');
        } catch (\LogicException $e) {
            $this->assertTrue(! is_null($e));
        }

        $this->assertEquals($engine->resolvePath('subdir/0nested'), $this->basedirs[0] . DIRECTORY_SEPARATOR . 'subdir' . DIRECTORY_SEPARATOR . '0nested.php');
    }

    public function testBasedirs()
    {
        $engine = new Engine($this->basedirs2, $this);

        $this->assertEquals($engine->resolvePath('0content'), $this->basedirs2[1] . DIRECTORY_SEPARATOR . '0content.php');
    }

    public function testResolveEnv() 
    {
        $engine = new Engine($this->basedirs);

        $vars = ['foo' => 1, 'bar' => 'str'];
        $x = $engine->resolveEnv('0content', $vars);
        $this->assertEquals($vars, $x);
    }

    public function provideVariables($template)
    {
        return ['foo' => 10, 'baz' => '33'];
    }

    public function testResolveEnv2()
    {
        $engine = new Engine($this->basedirs, $this);

        $vars = ['foo' => 1, 'bar' => 'str'];
        $x = $engine->resolveEnv('0content', $vars);
        $this->assertEquals($x, ['foo' => 1, 'bar' => 'str', 'baz' => '33']);
    }

    public function testRender()
    {
        $engine = new Engine($this->basedirs);

        $output = $engine->render('0content');
        $this->assertEquals($output, 'I\'m here.');

        $output = $engine->render('subdir/0nested', ['bar' => 'str', 'baz' => 'ing']);
        $this->assertEquals($output, "DEF\nstr \ning");
    }

    public function testRender2()
    {
        $engine = new Engine($this->basedirs, $this);

        $output = $engine->render('subdir/0nested', ['foo' => 'str', 'bar' => 'ing']);
        $this->assertEquals($output, "DEF\ning \n33");
    }
}