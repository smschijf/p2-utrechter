<?php

namespace AForms\Infra;

class FakeExtensionMapper 
{

    protected function findById($id) 
    {
        switch ($id) {
            case 1: 
                return (object)array(
                    'id' => 1, 
                    'title' => '見積書'
                );
            case 2: 
                return (object)array(
                    'id' => 2, 
                    'title' => '注文書'
                );
        }
        return null;
    }

    public function getList() 
    {
        add_filter('aforms_compose_thanks_mail', [$this, 'composeThanksMail'], 10, 3);
        add_filter('aforms_compose_report_mail', [$this, 'composeThanksMail'], 10, 3);

        return array($this->findById(1), $this->findById(2));
    }

    public function composeThanksMail($mail, $form, $order) 
    {
        $mail->attachments = ['/var/www/html/wp-content/plugins/aforms/asset/noimage.png'];
        return $mail;
    }

    public function extendActionSpecMap($actionSpecMap, $form) 
    {
        return $actionSpecMap;

        foreach ($form->extensions as $id) {
            $ext = $this->findById($id);
            if (! $ext) continue;

            if ($form->doConfirm) {
                $actionSpecMap->confirm = array(
                    (object)array(
                        'action' => 'custom', 
                        'id' => $ext->id, 
                        'buttonType' => 'primary', 
                        'label' => $ext->title . 'を出力'
                    )
                );
            } else {
                $actionSpecMap->input = array(
                    (object)array(
                        'action' => 'custom', 
                        'id' => $ext->id, 
                        'buttonType' => 'primary', 
                        'label' => $ext->title . 'を出力'
                    )
                );
            }
        }
        return $actionSpecMap;
    }

    public function extendCustomResponseSpec($responseSpec, $customId, $form, $order) 
    {
        foreach ($form->extensions as $id) {
            $ext = $this->findById($id);
            if (! $ext) continue;

            if (! $form->thanksUrl) {
                $responseSpec->option = (object)array(
                    'action' => 'open', 
                    'data' => 'http://localhost/wp-content/plugins/aforms/asset/noimage.png'
                );
            }
        }
        return $responseSpec;
    }

    public function extendResponseSpec($responseSpec, $form, $order) 
    {
        foreach ($form->extensions as $id) {
            $ext = $this->findById($id);
            if (! $ext) continue;

                $responseSpec->option = (object)array(
                    'action' => 'open', 
                    'data' => 'http://localhost/wp-content/plugins/aforms/asset/noimage.png'
                );
        }
        return $responseSpec;
    }

    public function extendWordDefinition($word) 
    {
        $word['Output PDF'] = '見積書を出力する';
        return $word;
    }
}