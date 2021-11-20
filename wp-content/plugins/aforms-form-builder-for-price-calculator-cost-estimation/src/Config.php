<?php

namespace AForms;

use Aura\Di\Container;
use Aura\Di\ContainerConfig;

class Config extends ContainerConfig
{
    public function define(Container $di) 
    {
        global $wpdb;
        $tpldir = basename(dirname(dirname(__FILE__))). '/src/template';

        // Responders
        $di->params['AForms\Shell\HtmlResponder'][0] = $di->lazyNew('tyam\bamboo\Engine');
        $di->params['AForms\Shell\HtmlResponder'][1] = $di->lazyGet('urlHelper');
        $di->params['AForms\Shell\HtmlResponder'][2] = $di->lazyGet('resolver');
        $di->params['AForms\Shell\HtmlResponder'][3] = $tpldir;
        
        // Bamboo
        $di->params['tyam\bamboo\Engine'][0] = [__DIR__.'/template'];

        // UrlHelper
        $di->set('urlHelper', $di->lazyNew('AForms\Shell\UrlHelper'));
        $di->params['AForms\Shell\UrlHelper'][0] = 'wq_nonce';
        $di->params['AForms\Shell\UrlHelper'][1] = plugins_url('', dirname(__FILE__));

        // resolver
        $di->set('resolver', $di->lazy(array($di, 'newResolutionHelper')));

        // Validator
        $di->set('validator', $di->lazyNew('JsonSchema\Validator'));

        // Session
        $di->set('session', $di->lazyNew('AForms\Infra\WpSession'));

        // options
        $di->set('options', $di->lazyNew('AForms\Infra\WpOptions'));
        $di->params['AForms\Infra\WpOptions'][0] = $tpldir;

        // scorer which always be passed.
        $di->params['AForms\Infra\ConstScorer'][0] = 1.0;

        // extension
        if (true) {
            $di->set('extension', $di->lazyNew('AForms\Infra\ExtensionMapper'));
            $di->params['AForms\Infra\ExtensionMapper'][0] = $di->lazyGet('options');
        } else {
            $di->set('extension', $di->lazyNew('AForms\Infra\FakeExtensionMapper'));
        }

        // Infra
        $di->set('rule', $di->lazyNew('AForms\Infra\RuleMapper'));
        $di->params['AForms\Infra\RuleMapper'][0] = $wpdb;
        $di->set('word', $di->lazyNew('AForms\Infra\WordMapper'));
        $di->params['AForms\Infra\WordMapper'][0] = $wpdb;
        $di->params['AForms\Infra\WordMapper'][1] = $di->lazyGet('extension');
        $di->set('behavior', $di->LazyNew('AForms\Infra\BehaviorMapper'));
        $di->params['AForms\Infra\BehaviorMapper'][0] = $wpdb;
        $di->set('form', $di->lazyNew('AForms\Infra\FormMapper'));
        $di->params['AForms\Infra\FormMapper'][0] = $wpdb;
        $di->set('order', $di->lazyNew('AForms\Infra\OrderMapper'));
        $di->params['AForms\Infra\OrderMapper'][0] = $wpdb;
        $di->params['AForms\Infra\OrderMapper'][1] = $di->lazyGet('rule');
        $di->params['AForms\Infra\OrderMapper'][2] = $di->lazyGet('word');
        $di->params['AForms\Infra\OrderMapper'][3] = $di->lazyGet('options');

        // App
        $di->params['AForms\App\Admin\Install'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyNew('AForms\Infra\OrderMapper'), 
            $di->lazyGet('session'), 
            $di->lazyGet('options')
        );
        $di->params['AForms\App\Admin\SettingsRef']= array(
            $di->lazyGet('rule'), 
            $di->lazyGet('word'), 
            $di->lazyGet('behavior'), 
            $di->lazyGet('session')
        );
        $di->params['AForms\App\Admin\SettingsSet']= array(
            $di->lazyGet('rule'), 
            $di->lazyGet('word'), 
            $di->lazyGet('behavior'), 
            $di->lazyGet('validator'), 
            $di->lazyGet('session')
        );
        $di->params['AForms\App\Admin\FormList'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('session')
        );
        $di->params['AForms\App\Admin\FormRef'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('session'), 
            $di->lazyGet('options'), 
            $di->lazyGet('extension')
        );
        $di->params['AForms\App\Admin\FormSet'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('session'), 
            $di->lazyGet('validator')
        );
        $di->params['AForms\App\Admin\FormDel'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('session')
        );
        $di->params['AForms\App\Admin\FormDup'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('session'), 
            $di->lazyGet('options')
        );
        $di->params['AForms\App\Admin\OrderList'] = array(
            $di->lazyGet('session'), 
            $di->lazyNew('AForms\Infra\OrderMapper'), 
            $di->lazyGet('extension')
        );
        $di->params['AForms\App\Admin\OrderListPage'] = array(
            $di->lazyGet('session'), 
            $di->lazyNew('AForms\Infra\OrderMapper'), 
            $di->lazyGet('extension')
        );
        $di->params['AForms\App\Admin\OrderDel'] = array(
            $di->lazyNew('AForms\Infra\OrderMapper'), 
            $di->lazyGet('session')
        );

        $di->params['AForms\App\Front\FormRef'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('session'), 
            $di->lazyGet('word'), 
            $di->lazyGet('extension')
        );
        $di->params['AForms\App\Front\OrderNew'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('rule'), 
            $di->lazyGet('word'), 
            $di->lazyNew('AForms\Infra\OrderMapper'), 
            $di->lazyNew('AForms\Infra\WpMailer'), 
            $di->lazyGet('session'), 
            $di->lazyGet('options'), 
            $di->lazyNew('AForms\Infra\GoogleScorer'), 
            //new \AForms\Infra\ConstScorer(0.4)
            $di->lazyGet('extension')
        );
        $di->params['AForms\App\Front\Custom'] = array(
            $di->lazyNew('AForms\Infra\FormMapper'), 
            $di->lazyGet('rule'), 
            $di->lazyGet('word'), 
            $di->lazyGet('session'), 
            $di->lazyGet('options'), 
            $di->lazyNew('AForms\Infra\GoogleScorer'), 
            $di->lazyNew('AForms\Infra\WpMailer'), 
            $di->lazyGet('extension')
        );
    }
}