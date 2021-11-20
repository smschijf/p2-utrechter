<?php
define( 'WP_CACHE', true );
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'utrechter' );

/** MySQL database username */
define( 'DB_USER', 'root' );

/** MySQL database password */
define( 'DB_PASSWORD', 'root' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'cb`AnsTNo# [903@sM>jV=;*BhFxW;eR?=4/_0o~P]e0NqZd<bfUuaH.%^>DNVoA' );
define( 'SECURE_AUTH_KEY',  'UlG9BwV<CfrB{A[dot%@x*kW?&iw{VzvF9jC?i0Kosee{#.Z;--9s{|5N1c^=Qsd' );
define( 'LOGGED_IN_KEY',    'zMHxJJV{XgHov#MhX+IYZ2rHzK1VhUnKYYD6{ePxxqyQNDobcI4u&/yk%x%D|U.^' );
define( 'NONCE_KEY',        'pV!|hK|Va67TjMUFHt(t#PtSNuyX-%ZVz3t2GCMu$NI@2TB6RPMDY`/x&xjqS,),' );
define( 'AUTH_SALT',        'A{%0Pn@Xrh5B)q%m .Fgwrqh6ucvIpCrdi)g,f{R{T9^3L]x/tkXA^*56_gi5Hq>' );
define( 'SECURE_AUTH_SALT', 'K2E^&A8#_Wzd^w!1*b>g~]QB8fp9B$NevU<s(mA=zhaq#ve5ebHEIg}s=j)8p3aZ' );
define( 'LOGGED_IN_SALT',   'jzwJKtR~Gg3+4*tbn+K>QaK|=ws@ H*Q}@h{TlGy:D&g^G9NX.a|ZiG`X|.7A%ez' );
define( 'NONCE_SALT',       'wO?HT%(Q_-MA?7.mhtxS+,:4Jdr!Fb?mGnFcQCw7:Ct!<`}$pZ1OfCZ04%0}wRTY' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
