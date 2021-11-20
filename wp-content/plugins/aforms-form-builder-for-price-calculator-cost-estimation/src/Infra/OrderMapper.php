<?php

namespace AForms\Infra;

use AForms\Domain\Lib;

class OrderMapper 
{
    use Lib;

    const TABLE = "wqorders";
    protected $wpdb;
    protected $ruleRepo;
    protected $wordRepo;
    protected $options;
    
    public function __construct($wpdb, $ruleRepo, $wordRepo, $options) 
    {
        $this->wpdb = $wpdb;
        $this->ruleRepo = $ruleRepo;
        $this->wordRepo = $wordRepo;
        $this->options = $options;
    }

    public function createTable() 
    {
        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

        $table = $this->wpdb->prefix . self::TABLE;
        $charset_collate = $this->wpdb->get_charset_collate();
        $sql = "CREATE TABLE $table ("
             . "  id bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY, "
             . "  formId bigint(20) NOT NULL, "
             . "  formTitle varchar(100) NOT NULL, "
             . "  customer bigint(20) NULL, "
             . "  total decimal(15,2) NOT NULL, "
             . "  created int(11) NOT NULL, "
             . "  content mediumtext NOT NULL "
             . ") ".$charset_collate;

        dbDelta($sql);
    }

    // Dropping-table moved to aforms.php

    protected function rowToObject($row) 
    {
        $rule = $this->ruleRepo->load();
        $word = $this->wordRepo->load();

        if ($row['customer_id']) {
            $customer = new \stdClass();
            $customer->id = (int)$row['customer_id'];
            $customer->name = $row['customer_name'];
        } else {
            $customer = null;
        }

        $order = new \stdClass();
        $order->id = (int)$row['id'];
        $order->formId = (int)$row['formId'];
        $order->formTitle = $row['formTitle'];
        $order->customer = $customer;
        $order->total = (float)$row['total'];
        $order->created = (int)$row['created'];
        
        $content = json_decode($row['content'], false);

        // migration
        if (! property_exists($content, 'condition')) {
            $content->condition = new \stdClass();
        }
        if (property_exists($content, 'tax')) {
            $content->taxes = array('' => $content->tax);
            $content->defaultTaxRate = $rule->taxRate;
        }
        foreach ($content->details as $detail) {
            if (! property_exists($detail, 'taxRate')) {
                $detail->taxRate = null;
            }
            if (! property_exists($detail, 'price')) {
                $detail->price = $this->normalizePrice($rule, $detail->quantity * $detail->unitPrice);
            }
        }
        if (! property_exists($content, 'currency')) {
            list($pricePrefix, $priceSuffix) = explode('%s', $word['$%s']);
            $content->currency = (object)array(
                'taxPrecision' => $rule->taxPrecision, 
                'pricePrefix' => $pricePrefix, 
                'priceSuffix' => $priceSuffix, 
                'decPoint' => $word['.'], 
                'thousandsSep' => $word[',']
            );
        }

        $order->details = $content->details;
        $order->attrs = $content->attrs;
        if (property_exists($content, 'taxes')) {
            $order->taxes = $content->taxes;
            $order->defaultTaxRate = $content->defaultTaxRate;
            $order->subtotal = $content->subtotal;
        }
        $order->condition = $content->condition;
        $order->currency = $content->currency;

        return $order;
    }

    public function findById($id) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $sql = "SELECT o.*, u.ID AS customer_id, u.user_nicename AS customer_name "
             . "FROM $table o LEFT JOIN ".$this->wpdb->users." u ON o.customer = u.ID "
             . "WHERE o.id = %d";
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

    public function slice($offset, $limit) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $sql = "SELECT o.*, u.ID AS customer_id, u.user_nicename AS customer_name "
             . "FROM $table o LEFT JOIN ".$this->wpdb->users." u ON o.customer = u.ID "
             . "ORDER BY o.id DESC LIMIT %d, %d";
        $rows = $this->wpdb->get_results($this->wpdb->prepare($sql, $offset, $limit), ARRAY_A);
        
        $rv = array();
        foreach ($rows as $row) {
            $rv[] = $this->rowToObject($row);
        }

        return $rv;
    }

    protected function objectToRow($order) 
    {
        $data = array(
            'formId' => $order->formId, 
            'formTitle' => $order->formTitle, 
            'customer' => ($order->customer) ? $order->customer->id : null, 
            'total' => $order->total, 
            'created' => $order->created, 
            'content' => json_encode($order)
        );
        $format = array('%d', '%s', '%d', '%f', '%d', '%s');
        return array($data, $format);
    }

    public function add($order) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        list($data, $format) = $this->objectToRow($order);
        $this->wpdb->insert($table, $data, $format);
        $order->id = $this->wpdb->insert_id;
        return $order;
    }

    public function sync($order) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        list($data, $format) = $this->objectToRow($order);
        $this->wpdb->update($table, $data, array('id' => $order->id), $format, array('%d'));
    }

    public function remove($order) 
    {
        $table = $this->wpdb->prefix . self::TABLE;
        $this->wpdb->delete($table, array('id' => $order->id), array('%d'));
    }
}