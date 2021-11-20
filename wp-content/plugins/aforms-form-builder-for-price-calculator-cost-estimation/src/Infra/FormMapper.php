<?php

namespace AForms\Infra;

class FormMapper 
{
    const TABLE = "wqforms";
    protected $wpdb;

    public function __construct($wpdb) 
    {
        $this->wpdb = $wpdb;
    }

    public function getSampleForm($author) 
    {
        $json = <<<EOT
        {
            "id": 0, 
            "title": "BTO-PC Order Form", 
            "navigator": "horizontal", 
            "doConfirm": true, 
            "thanksUrl": "", 
            "detailItems": [
                {
                    "type": "Auto", 
                    "id": 21, 
                    "category": "Machine", 
                    "name": "SC2310-T", 
                    "normalPrice": null, 
                    "price": 12800, 
                    "depends": {}, 
                    "quantity": -1
                }, 
                {
                    "type": "Selector", 
                    "id": 1, 
                    "image": "", 
                    "name": "OS", 
                    "note": {"nodeName":"em", "attributes":{}, "children":["On HOME user campaign!"]}, 
                    "multiple": false, 
                    "quantity": -1, 
                    "options": [
                        {
                            "type": "Option", 
                            "id": 101, 
                            "image": "", 
                            "name": "Windows10 Home", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 9800, 
                            "labels": {"home-use":true}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 102, 
                            "image": "", 
                            "name": "Windows10 Pro", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 12800, 
                            "labels": {"pro":true}, 
                            "depends": {}
                        }
                    ]
                }, 
                {
                    "type": "Selector", 
                    "id": 2, 
                    "image": "", 
                    "name": "CPU", 
                    "note": null, 
                    "multiple": false, 
                    "quantity": -1, 
                    "options": [
                        {
                            "type": "Option", 
                            "id": 111, 
                            "image": "", 
                            "name": "Intel Core i7", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 18800, 
                            "labels": {}, 
                            "depends": {"pro":true}
                        }, 
                        {
                            "type": "Option", 
                            "id": 112, 
                            "image": "", 
                            "name": "Intel Core i5", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 12800, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 113, 
                            "image": "", 
                            "name": "Intel Core i3", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 10800, 
                            "labels": {}, 
                            "depends": {}
                        }
                    ]
                }, 
                {
                    "type": "Selector", 
                    "id": 10, 
                    "image": "", 
                    "name": "Memory", 
                    "note": null, 
                    "multiple": false, 
                    "quantity": -1, 
                    "options": [
                        {
                            "type": "Option", 
                            "id": 301, 
                            "image": "", 
                            "name": "4GB", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 10000, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 302, 
                            "image": "", 
                            "name": "8GB", 
                            "note": null, 
                            "normalPrice": 18000, 
                            "price": 14000, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 303, 
                            "image": "", 
                            "name": "16GB", 
                            "note": null, 
                            "normalPrice": 32000, 
                            "price": 24000, 
                            "labels": {}, 
                            "depends": {}
                        }
                    ]
                }, 
                {
                    "type": "Selector", 
                    "id": 3, 
                    "image": "", 
                    "name": "Accessories", 
                    "note": null, 
                    "multiple": true, 
                    "quantity": -1, 
                    "options": [
                        {
                            "type": "Option", 
                            "id": 121, 
                            "image": "", 
                            "name": "USB full keyboard", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 1200, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 122, 
                            "image": "", 
                            "name": "Bluetooth full keyboard", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 2500, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 123, 
                            "image": "", 
                            "name": "Bluetooth mobile keyboard", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 2500, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 124, 
                            "image": "", 
                            "name": "USB wheel mouse", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 580, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 125, 
                            "image": "", 
                            "name": "Bluetooth mobile mouse", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 1080, 
                            "labels": {}, 
                            "depends": {}
                        }, 
                        {
                            "type": "Option", 
                            "id": 126, 
                            "image": "", 
                            "name": "Bluetoosh mobile touchpad", 
                            "note": null, 
                            "normalPrice": null, 
                            "price": 1400, 
                            "labels": {}, 
                            "depends": {}
                        }
                    ]
                }, 
                {
                    "type": "PriceWatcher", 
                    "id": 23, 
                    "lower": 70000, 
                    "lowerIncluded": true, 
                    "higher": null, 
                    "higherIncluded": false, 
                    "labels": {"big-deal":true}
                }, 
                {
                    "type": "Auto", 
                    "id": 24, 
                    "category": "Bonus", 
                    "name": "Mobile Wi-Fi Adaptor", 
                    "normalPrice": 5000, 
                    "price": 0, 
                    "depends": {"big-deal":true}, 
                    "quantity": -1
                }, 
                {
                    "type": "Auto", 
                    "id": 22, 
                    "category": "Campaign", 
                    "name": "HOME campaign discount", 
                    "normalPrice": null, 
                    "price": -5000, 
                    "depends": {"home-use":true}, 
                    "quantity": -1
                }
            ], 
            "attrItems": [
                {
                    "id":"1", 
                    "type":"Name", 
                    "name":"Your Name", 
                    "divided":false, 
                    "required":true, 
                    "note":""
                }, 
                {
                    "id":"2", 
                    "type":"Email", 
                    "name":"Your E-Mail Address", 
                    "required":true, 
                    "note":"", 
                    "repeated":true
                }, 
                {
                    "id":"3", 
                    "type":"Radio", 
                    "name":"Sex", 
                    "required":true, 
                    "note":"", 
                    "options":[
                        "Male", 
                        "Female"
                    ]
                }, 
                {
                    "id":"4", 
                    "type":"Tel", 
                    "name":"Phone Number", 
                    "required":false, 
                    "divided":true, 
                    "note":""
                }, 
                {
                    "id":"6", 
                    "type":"Address", 
                    "name":"Address", 
                    "required":true, 
                    "note":""
                }, 
                {
                    "id":"10", 
                    "type":"Checkbox", 
                    "name":"I accept the user policy", 
                    "required":true, 
                    "note": [
                        "Confirm ", 
                        {"nodeName":"a", "attributes":{"href":"/inexistent-user-policy", "target":"_blank"}, "children":["User Policy"]}, 
                        "."
                    ]
                }
            ], 
            "mail": {
                "subject":"Thank you for your order", 
                "fromAddress": "shop@example.com", 
                "fromName": "BTO-PC Office", 
                "notifyTo":"", 
                "textBody":"Thank you for your order."
            }
        }
EOT;
        $form = json_decode($json, false);
        $form->author = $author;
        $form->modified = time();
        return $form;
    }

    public function createTable() 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $charset_collate = $this->wpdb->get_charset_collate();
        $sql = "CREATE TABLE $table (\n"
             . "  id bigint(20) NOT NULL AUTO_INCREMENT, \n"
             . "  title varchar(100) NOT NULL, \n"
             . "  author bigint(20) NOT NULL, \n"
             . "  modified int(11) NOT NULL, \n"
             . "  content mediumtext NOT NULL, \n"
             . "  dataver int(11) DEFAULT 1 NOT NULL, \n"
             . "  PRIMARY KEY  (id) \n"
             . ") ".$charset_collate.";";
        
        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta($sql);
    }
    
    // Dropping-table moved to aforms.php

    protected function rowToObject($row) 
    {
        $version = (int)$row['dataver'];

        if ($row['author_id']) {
            $author = new \stdClass();
            $author->id = (int)$row['author_id'];
            $author->name = $row['author_name'];
        } else {
            $author = null;
        }

        $form = new \stdClass();
        $form->id = (int)$row['id'];
        $form->title = $row['title'];
        $form->author = $author;
        $form->modified = (int)$row['modified'];
        
        $content = json_decode($row['content'], false);
        
        // migiration
        if (! property_exists($content, 'doConfirm')) {
            $content->doConfirm = true;
        }
        if (! property_exists($content, 'navigator')) {
            $content->navigator = 'horizontal';
        }
        if (! property_exists($content, 'thanksUrl')) {
            $content->thanksUrl = '';
        }
        foreach ($content->detailItems as $di) {
            if (($di->type == 'Selector' || $di->type == 'Auto') && ! property_exists($di, 'quantity')) {
                // default quantity is 1-fixed.
                $di->quantity = -1;
            }
            if ($di->type == 'Auto' && ! property_exists($di, 'taxRate')) {
                $di->taxRate = null;
            }
            if ($di->type == 'Auto' && ! property_exists($di, 'normalPrice')) {
                $di->normalPrice = null;
            }
            if ($di->type == 'Auto' && ! property_exists($di, 'priceAst')) {
                $di->priceAst = (float)$di->price;
                $di->priceVars = array();
                $di->price = "" . $di->price;
            }
            if ($di->type == 'Selector') {
                foreach ($di->options as $option) {
                    if (! property_exists($option, 'ribbons')) {
                        $option->ribbons = (object)array();
                    }
                    if (! property_exists($option, 'taxRate')) {
                        $option->taxRate = null;
                    }
                    if ($version == 1 && ($option->normalPrice === '0' || $option->normalPrice === 0)) {
                        $option->normalPrice = null;
                    }
                    if ($version == 1 && property_exists($option->ribbons, 'ribbon1')) {
                        $option->ribbons->SALE = true;
                    }
                    if ($version == 1 && property_exists($option->ribbons, 'ribbon2')) {
                        $option->ribbons->RECOMMENDED = true;
                    }
                }
            }
        }
        foreach ($content->attrItems as $ai) {
            if ($ai->type == 'Name' && ! property_exists($ai, 'pattern')) {
                $ai->pattern = 'none';
            }
            if (($ai->type == 'Radio' || $ai->type == 'Checkbox') && ! property_exists($ai, 'initialValue')) {
                $ai->initialValue = '';
            }
            if ($ai->type == 'Address' && ! property_exists($ai, 'autoFill')) {
                $ai->autoFill = 'none';
            }
        }
        if (! property_exists($content, 'extensions')) {
            $content->extensions = array();
        }

        $form->navigator = $content->navigator;
        $form->doConfirm = $content->doConfirm;
        $form->thanksUrl = $content->thanksUrl;
        $form->detailItems = $content->detailItems;
        $form->attrItems = $content->attrItems;
        $form->mail = $content->mail;
        $form->extensions = $content->extensions;

        return $form;
    }

    public function findById($id) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $sql = "SELECT f.*, u.ID AS author_id, u.user_nicename AS author_name "
             . "FROM $table f LEFT JOIN ".$this->wpdb->users." u ON f.author = u.ID "
             . "WHERE f.id = %d";
        $row = $this->wpdb->get_row($this->wpdb->prepare($sql, $id), ARRAY_A);
        if (! $row) {
            return null;
        }

        return $this->rowToObject($row);
    }

    public function count() 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $sql = "SELECT COUNT(*) FROM $table";
        return $this->wpdb->get_var($sql);
    }

    public function getList() 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $sql = "SELECT f.*, u.ID AS author_id, u.user_nicename AS author_name "
             . "FROM $table f LEFT JOIN ".$this->wpdb->users." u ON f.author = u.ID "
             . "ORDER BY f.id DESC ";
        $rows = $this->wpdb->get_results($sql, ARRAY_A);

        $rv = array();
        foreach ($rows as $row) {
            $rv[] = $this->rowToObject($row);
        }

        return $rv;
    }

    protected function objectToRow($form) 
    {
        $data = array(
            'title' => $form->title, 
            'author' => ($form->author) ? $form->author->id : null, 
            'modified' => $form->modified, 
            'content' => json_encode($form), 
            'dataver' => 2
        );
        $format = array('%s', '%d', '%d', '%s', '%d');
        return array($data, $format);
    }

    public function add($form) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        list($data, $format) = $this->objectToRow($form);
        $this->wpdb->insert($table, $data, $format);
        $form->id = $this->wpdb->insert_id;
        return $form;
    }

    public function sync($form) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        list($data, $format) = $this->objectToRow($form);
        $this->wpdb->update($table, $data, array('id' => $form->id), $format, array('%d'));
    }

    public function remove($form) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $this->wpdb->delete($table, array('id' => $form->id), array('%d'));
    }
}