<?php
namespace AForms\Infra;
class WpSession 
{
    public function isLoggedIn()
    {
        return is_user_logged_in();
    }
    public function isAdmin() 
    {
        return current_user_can('manage_options');
    }

    public function getUser() 
    {
        $user = wp_get_current_user();
        $rv = new \stdClass();
        $rv->id = $user->ID;
        $rv->name = $user->data->display_name;
        return $rv;
    }
}