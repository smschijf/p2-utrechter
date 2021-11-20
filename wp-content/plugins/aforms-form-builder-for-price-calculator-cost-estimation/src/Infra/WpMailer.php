<?php

namespace AForms\Infra;

class WpMailer 
{
    protected $to = null;
    protected $fromName = null;
    protected $fromAddr = null;
    protected $bcc = null;
    protected $subject = null;
    protected $textBody = null;
    protected $attachments = '';

    public function setTo($to) 
    {
        $this->to = $to;
        return $this;
    }

    public function setFrom($name, $addr) 
    {
        $this->fromName = $name;
        $this->fromAddr = $addr;
        return $this;
    }

    public function setBcc($bcc) 
    {
        $this->bcc = $bcc;
        return $this;
    }

    public function setSubject($subject) 
    {
        $this->subject = $subject;
        return $this;
    }

    public function setTextBody($textBody) 
    {
        $this->textBody = $textBody;
        return $this;
    }

    public function setAttachments($attachments) 
    {
        $this->attachments = $attachments;
        return $this;
    }

    protected function assembleHeaders() 
    {
        $headers = array();
        $headers[] = "From: ".$this->fromName." <".$this->fromAddr.">";
        if ($this->bcc) {
            $headers[] = "Bcc: ".$this->bcc;
        }
        return $headers;
    }

    public function send() 
    {
        $x = wp_mail($this->to, $this->subject, $this->textBody, $this->assembleHeaders(), $this->attachments);
        
        return $this;
    }

    public function clear() 
    {
        $this->to = null;
        $this->fromName = null;
        $this->fromAddr = null;
        $this->bcc = null;
        $this->subject = null;
        $this->textBody = null;
        $this->attachments = '';

        return $this;
    }
}