<?php

namespace tyam\bamboo\tests;

use PHPUnit_Framework_TestCase as TestCase;
use tyam\bamboo\Engine;
use tyam\bamboo\VariableProvider;


class RenderTest extends TestCase implements VariableProvider 
{
    private $basedirs = [
        __DIR__ . DIRECTORY_SEPARATOR . 'templates'
    ];

    public function provideVariables($template)
    {
        if ($template == '1content') {
            return [
                'title' => 'Flying', 
                'content' => 'I am on trip.', 
                'tags' => 'trip'
            ];
        } else if ($template == '1usersidebar') {
            return [
                'tagcloud' => 'php, PaaS, bamboo'
            ];
        } else if ($template == 'subdir/1sidebar') {
            return [
                'profile' => 'tyam'
            ];
        } else {
            return [];
        }
    }

    public function testRender()
    {
        $engine = new Engine($this->basedirs, $this);

        $output = $engine->render('1content', $this->provideVariables('1content'));
        $expected = <<<EOT
<html>
<head>
<title>Flying | Site</title>
</head>
<body>
<div class="header">login</div>
<div class="main">
<div class="tags">trip</div>
<h1>Flying</h1>
<div>Hi,
I am on trip.</div>
</div>
<div clas="sidebar">tyam 
tagcloud: php, PaaS, bamboo</div>
<div class="footer">copyright</div>
</body>
</html>
EOT;
        $this->assertEquals($output, $expected);
    }
}