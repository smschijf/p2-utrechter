<?php
// exit if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

/**
 * Cookie_Notice_Welcome class.
 * 
 * @class Cookie_Notice_Welcome
 */
class Cookie_Notice_Welcome {
	
	private $app_login_url = '';

	public function __construct() {
		// actions
		add_action( 'admin_init', array( $this, 'welcome' ) );
		add_action( 'wp_ajax_cn_welcome_screen', array( $this, 'welcome_screen' ) );
		
		$this->app_login_url = 'https://app.hu-manity.co/#/en/cc2/login';
	}

	/**
	 * Load scripts and styles - admin.
	 */
	public function admin_enqueue_scripts( $page ) {
		if ( in_array( Cookie_Notice()->get_status(), array( 'active', 'pending' ) ) )
			return;
		
		wp_enqueue_style( 'dashicons' );
		
		wp_enqueue_style( 'cookie-notice-modaal', plugins_url( '../assets/modaal/css/modaal.min.css', __FILE__ ), array(), Cookie_Notice()->defaults['version'] );
		wp_enqueue_script( 'cookie-notice-modaal', plugins_url( '../assets/modaal/js/modaal.min.js', __FILE__ ), array(), Cookie_Notice()->defaults['version'] );
		
		wp_enqueue_style( 'cookie-notice-spectrum', plugins_url( '../assets/spectrum/spectrum.min.css', __FILE__ ), array(), Cookie_Notice()->defaults['version'] );
		
		wp_enqueue_style( 'cookie-notice-microtip', plugins_url( '../assets/microtip/microtip.min.css', __FILE__ ), array(), Cookie_Notice()->defaults['version'] );

		wp_enqueue_script( 'cookie-notice-spectrum', plugins_url( '../assets/spectrum/spectrum.min.js', __FILE__ ), array(), Cookie_Notice()->defaults['version'] );
		wp_enqueue_script( 'cookie-notice-welcome', plugins_url( '../js/admin-welcome.js', __FILE__ ), array( 'jquery', 'jquery-ui-core', 'jquery-ui-progressbar' ), Cookie_Notice()->defaults['version'] );
		wp_enqueue_script( 'cookie-notice-braintree-client', 'https://js.braintreegateway.com/web/3.71.0/js/client.min.js', array(), null, false );
		wp_enqueue_script( 'cookie-notice-braintree-hostedfields', 'https://js.braintreegateway.com/web/3.71.0/js/hosted-fields.min.js', array(), null, false );
		wp_enqueue_script( 'cookie-notice-braintree-paypal', 'https://js.braintreegateway.com/web/3.71.0/js/paypal-checkout.min.js', array(), null, false );
		
		$js_args = array(
			'ajaxURL'		=> admin_url( 'admin-ajax.php' ),
			'nonce'			=> wp_create_nonce( 'cookie-notice-welcome' ),
			'initModal'		=> get_transient( 'cn_show_welcome' ), // welcome modal
			'error'			=> __( 'Unexpected error occurred. Please try again later.', 'cookie-notice' ),
			'statusPassed'	=> __( 'Passed', 'cookie-notice' ),
			'statusFailed'	=> __( 'Failed', 'cookie-notice' ),
			'complianceStatus' => Cookie_Notice()->get_status(),
			'complianceFailed' => __( '<em>Compliance Failed!</em>Your website does not achieve minimum viable compliance. <b><a href="#" class="cn-sign-up">Sign up to Cookie Compliance</a></b> to bring your site into compliance with the latest data privacy rules and regulations.', 'cookie-notice' ),
			'compliancePassed' => __( '<em>Compliance Passed!</em>Congratulations. Your website meets minimum viable compliance.', 'cookie-notice' ),
			'invalidFields'	=> __( 'Please fill all the required fields.', 'cookie-notice' )
		);
		
		// delete the show modal transient
		delete_transient( 'cn_show_welcome' );

		wp_localize_script(
			'cookie-notice-welcome',
			'cnWelcomeArgs',
			$js_args
		);

		wp_enqueue_style( 'cookie-notice-welcome', plugins_url( '../css/admin-welcome.css', __FILE__ ) );
	}
	
	/**
	 * Add one or more classes to the body tag in the dashboard.
	 *
	 * @param string $classes
	 * @return string
	 */
	public function admin_body_class( $classes ) {
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'cookie-notice-welcome' )
			$classes .= ' folded';
		
		return $classes;
	}

	/**
	 * Send user to the welcome page on first activation.
	 *
	 * @return void
	 */
	public function welcome() {
		global $pagenow;
		
		if ( $pagenow != 'admin.php' )
			return;
		
		if ( isset( $_GET['page'] ) && $_GET['page'] !== 'cookie-notice' )
			return;

		// bail if activating from network, or bulk, or within an iFrame
		if ( is_network_admin() || isset( $_GET['activate-multi'] ) || defined( 'IFRAME_REQUEST' ) )
			return;

		if ( (isset( $_GET['action'] ) && 'upgrade-plugin' == $_GET['action']) && (isset( $_GET['plugin'] ) && strstr( $_GET['plugin'], 'cookie-notice.php' )) )
			return;

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'admin_footer', array( $this, 'admin_footer' ) );
		
		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ) );
	}
		
	/**
	 * Welcome modal container.
	 */
	public function admin_footer() {
		echo '<button id="cn-modal-trigger" style="display:none;"></button>';
	}
	
	/**
	 * Output the welcome screen.
	 *
	 * @return void
	 */
	public function welcome_page() {
		// get plugin version
		$plugin_version = substr( Cookie_Notice()->defaults['version'], 0, 3 );
		$screen = ( isset( $_GET['screen'] ) ? (int) $_GET['screen'] : 1 );

		$this->welcome_screen( $screen );
	}
	
	/**
	 * Render welcome screen sidebar step.
	 * 
	 * @param int $step
	 * @return mixed
	 */
	public function welcome_screen( $screen, $echo = true ) {
		global $current_user;
		
		if ( ! current_user_can( 'install_plugins' ) )
			wp_die( _( 'You do not have permission to access this page.', 'cookie-notice' ) );

		$sidebars = array( 'about', 'login', 'register', 'configure', 'select_plan', 'success' );
		$steps = array( 1, 2, 3, 4 );
		$screens = array_merge( $sidebars, $steps );

		$is_ajax = defined( 'DOING_AJAX' ) && DOING_AJAX;
		$screen = ! empty( $screen ) && in_array( $screen, $screens ) ? $screen : ( isset( $_REQUEST['screen'] ) && in_array( $_REQUEST['screen'], $screens ) ? $_REQUEST['screen'] : '' );

		if ( empty( $screen ) )
			wp_die( _( 'You do not have permission to access this page.', 'cookie-notice' ) );

		if ( $is_ajax && ! check_ajax_referer( 'cookie-notice-welcome', 'nonce' ) )
			wp_die( _( 'You do not have permission to access this page.', 'cookie-notice' ) );

		// get token data
		$token_data = get_transient( 'cookie_notice_app_token' );

		// step screens
		if ( in_array( $screen, $steps ) ) {
			$html = '
			<div class="wrap full-width-layout cn-welcome-wrap cn-welcome-step-' . esc_attr( $screen ) . ' has-loader">';

			if ( $screen == 1 ) {
				$html .= $this->welcome_screen( 'about', false );
				
				$html .= '
				<div class="cn-content cn-sidebar-visible">
					<div class="cn-inner">
						<div class="cn-content-full">
							<h1><b>Cookie Compliance&trade;</b></h1>
							<h2>' . __( 'The next generation of Cookie Notice', 'cookie-notice' ) . '</h2>
							<div class="cn-lead">
								<p><b>' . __( 'Cookie Compliance is a free web application that enables websites to take a proactive approach to data protection and consent laws.', 'cookie-notice' ) . '</b></p>
								<div class="cn-hero-image">
									<div class="cn-flex-item">
										<img src="' . plugins_url( '../img/screen-compliance.png', __FILE__ ) . '" alt="Cookie Notice dashboard" />
									</div>
								</div>
								<p>' . __( 'It is the first solution to offer <b>intentional consent</b>, a new consent framework that incorporates the latest guidelines from over 100+ countries, and emerging standards from leading international organizations like the IEEE.', 'cookie-notice' ) . '</p>
								<p>' . __( 'Cookie Notice includes <b>seamless integration</b> with Cookie Compliance to help your site comply with the latest updates to existing consent laws and provide a beautiful, multi-level experience to engage visitors in data privacy decisions.', 'cookie-notice' ) . '</p>
							</div>';
							/*
							<div class="cn-lead">
								<p>' . __( 'Rules and regulations around cookie consent are <b>becoming more strict</b>, and enforcement of violations is rapidly increasing. So far in 2021, companies have paid fines totaling over €18M.', 'cookie-notice' ) . '</p>
								<p>' . __( 'If your website collects visitor data and does not (1) <b>Autoblock</b> cookies, (2) enable visitors to consent by <b>Cookie Category</b>, and/or (3) store <b>Proof-of-Consent</b>, your business is at risk.', 'cookie-notice' ) . '</p>
								<p>' . sprintf( __( 'Cookie Notice %s includes integration with <b>Cookie Compliance&trade;</b> web application that will help your site meet minimum viable compliance based on updates to existing laws (GDPR, CCPA) and introduction of new laws (ePrivacy, PECR).', 'cookie-notice' ),  Cookie_Notice()->defaults['version'] ) . '</p>	
							</div>
							*/
				$html .= '
							<div class="cn-buttons">
								<button type="button" class="cn-btn cn-btn-lg cn-screen-button" data-screen="3"><span class="cn-spinner"></span>' . __( 'Sign up to Cookie Compliance', 'cookie-notice' ) . '</button><br />
								<button type="button" class="cn-btn cn-btn-lg cn-btn-transparent cn-skip-button">' . __( 'Skip for now', 'cookie-notice' ) . '</button>
							</div>
							';
				/*
				$html .= '
							<div class="cn-hero-image">
								<div class="cn-flex-item">
									<div class="cn-logo-container">
										<img src="' . plugins_url( '../img/cookie-notice-logo-dark.png', __FILE__ ) . '">
										<span class="cn-badge">' . __( 'WP Plugin', 'cookie-notice' ) . '</span>
									</div>
									<img src="' . plugins_url( '../img/screen-notice.png', __FILE__ ) . '" alt="Cookie Notice dashboard" />
									<ul>
										<li><span>' . __( 'Customizable notice message', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Consent on click, scroll or close', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Multiple cookie expiry options', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Link to Privacy Policy page', 'cookie-notice' ) . '</span></li>
									</ul>
								</div>
								<div class="cn-flex-item">
									<img src="//cno0-53eb.kxcdn.com/screen-plus.png" alt="Cookie Notice + Compliance" />
								</div>
								<div class="cn-flex-item">
									<div class="cn-logo-container">
										<img src="' . plugins_url( '../img/cookie-compliance-logo-dark.png', __FILE__ ) . '">
										<span class="cn-badge">' . __( 'Web App', 'cookie-notice' ) . '</span>
									</div>
									<img src="' . plugins_url( '../img/screen-compliance.png', __FILE__ ) . '"alt="Cookie Compliance dashboard" />
									<ul>
										<li><span>' . __( 'Customizable <b>GDPR & CCPA</b> notice templates', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( '<b>Consent Analytics</b> Dashboard', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Cookie <b>Autoblocking</b> (complies with GDPR Art.7)', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( '<b>Cookie Categories</b> (complies with GDPR Art.32)', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( '<b>Proof-of-Consent</b> Storage (complies with GDPR Art.30)', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( "Link to <b>'Do Not Sell'</b> page (supports CCPA Sec.1798)", 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Enhanced design controls and options', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Multiple new banner positions', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Custom language localization', 'cookie-notice' ) . '</span></li>
									</ul>
								</div>
							</div>
				*/
			
				$html .= '
						</div>
					</div>
				</div>';

			} elseif ( $screen == 2 ) {
				$html .= $this->welcome_screen( 'configure', false );

				$html .= '
				<div id="cn_upgrade_iframe" class="cn-content cn-sidebar-visible has-loader cn-loading"><span class="cn-spinner"></span>
					<iframe id="cn_iframe_id" src="' . home_url( '/?cn_preview_mode=1' ) . '"></iframe>
				</div>';
			} elseif ( $screen == 3 ) {
				// get options
				$app_config = get_transient( 'cookie_notice_app_config' );

				$html .= $this->welcome_screen( 'register', false );
				
				$html .= '
				<div class="cn-content cn-sidebar-visible">
					<div class="cn-inner">
						<div class="cn-content-full">
							<h1><b>Cookie Compliance&trade;</b></h1>
							<h2>' . __( 'The next generation of Cookie Notice', 'cookie-notice' ) . '</h2>
							<div class="cn-lead">
								<p>' . __( 'Take a proactive approach to data protection and consent laws by signing up for Cookie Compliance account. Then select a limited Basic Plan for free or get one of the Professional Plans for unlimited visits, consent storage, languages and customizations.', 'cookie-notice' ) . '</p>
							</div>';
				/*
							<div class="cn-billing-wrapper cn-radio-wrapper">
								<label for="cn_billing_monthly"><input id="cn_billing_monthly" type="radio" name="cn_billing" value="monthly" checked><span><span>' . __( 'Billing Monthly', 'cookie-notice' ) . '</span><span class="cn-plan-overlay"></span></span></label><label for="cn_billing_yearly"><input id="cn_billing_yearly" type="radio" name="cn_billing" value="yearly"><span><span>' . __( 'Billing Yearly', 'cookie-notice' ) . '</span> <span class="cn-price-off">(' . __( '15% off', 'cookie-notice' ) . ')</span><span class="cn-plan-overlay"></span></span></label>
							</div>
				
				$html .= '
							<div class="cn-hero-image">
								<div class="cn-flex-item">
									<div class="cn-logo-container">
										<img src="' . plugins_url( '../img/cookie-notice-logo-dark.png', __FILE__ ) . '">
										<span class="cn-badge">' . __( 'WP Plugin', 'cookie-notice' ) . '</span>
									</div>
									<img src="' . plugins_url( '../img/screen-notice.png', __FILE__ ) . '" alt="Cookie Notice dashboard" />
									<ul class="cn-features-list">
										<li><span>' . __( '<b>Free</b>', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Customizable notice message', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Consent on click, scroll or close', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Link to Privacy Policy page', 'cookie-notice' ) . '</span></li>
									</ul>
								</div>
								<div class="cn-flex-item">
									<img src="//cno0-53eb.kxcdn.com/screen-plus.png" alt="Cookie Notice + Compliance" />
								</div>
								<div class="cn-flex-item">
									<div class="cn-logo-container">
										<img src="' . plugins_url( '../img/cookie-compliance-logo-dark.png', __FILE__ ) . '">
										<span class="cn-badge">' . __( 'Web App', 'cookie-notice' ) . '</span>
									</div>
									<img src="' . plugins_url( '../img/screen-compliance.png', __FILE__ ) . '"alt="Cookie Compliance dashboard" />
									<ul class="cn-features-list">
										<li><span>' . __( '<b>Free plan</b>', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Consent Analytics Dashboard', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Cookie Autoblocking', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Cookie Categories', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( 'Proof-of-Consent Storage', 'cookie-notice' ) . '</span></li>
										<li><span>' . __( "Link to 'Do Not Sell' page", 'cookie-notice' ) . '</span></li>
									</ul>
								</div>
							</div>';
				*/

				$html .= '	
							<h3 class="cn-pricing-select">' . __( 'Compliance Plans', 'cookie-notice' ) . ':</h3>
							<div class="cn-pricing-table">
								<label class="cn-pricing-item" for="cn_pricing_plan_free">
									<input id="cn_pricing_plan_free" type="radio" name="cn_pricing_plan" value="free">
									<div class="cn-pricing-info">
										<div class="cn-pricing-head">
											<h4>' . __( 'Basic', 'cookie-notice' ) . '</h4>
											<span class="cn-plan-pricing"><span class="cn-plan-price">' . __( 'Free', 'cookie-notice' ) . '</span></span>
										</div>
										<div class="cn-pricing-body">
											<p class="cn-included"><span class="cn-icon"></span>' . __( 'GDPR, CCPA, ePrivacy, PECR compliance', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( 'Consent Analytics Dashboard', 'cookie-notice' ) . '</p>
											<p class="cn-excluded"><span class="cn-icon"></span>' . __( '<b>1,000</b> visits / month', 'cookie-notice' ) . '</p>
											<p class="cn-excluded"><span class="cn-icon"></span>' . __( '<b>30 days</b> consent storage', 'cookie-notice' ) . '</p>	
											<p class="cn-excluded"><span class="cn-icon"></span>' . __( '<b>1 additional</b> language', 'cookie-notice' ) . '</p>
											<p class="cn-excluded"><span class="cn-icon"></span>' . __( '<b>Basic</b> Support', 'cookie-notice' ) . '</p>
										</div>
										<div class="cn-pricing-footer">
											<button type="button" class="cn-btn cn-btn-outline">' . __( 'Select Plan', 'cookie-notice' ) . '</button>
										</div>
									</div>
								</label>
								<label class="cn-pricing-item" for="cn_pricing_plan_monthly">
									<input id="cn_pricing_plan_monthly" type="radio" name="cn_pricing_plan" value="monthly">
									<div class="cn-pricing-info">
										<div class="cn-pricing-head">
											<h4>' . __( 'Professional Monthly', 'cookie-notice' ) . '</h4>
											<span class="cn-plan-pricing"><span class="cn-plan-price"><sup>$</sup>14.95</span> / ' . __( 'month', 'cookie-notice' ) . '</span>
										</div>
										<div class="cn-pricing-body">
											<p class="cn-included"><span class="cn-icon"></span>' . __( 'GDPR, CCPA, ePrivacy, PECR compliance', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( 'Consent Analytics Dashboard', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Unlimited</b> visits', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Lifetime</b> consent storage', 'cookie-notice' ) . '</p>	
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Unlimited</b> languages', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Regular</b> Support', 'cookie-notice' ) . '</p>
										</div>
										<div class="cn-pricing-footer">
											<button type="button" class="cn-btn cn-btn-outline">' . __( 'Select Plan', 'cookie-notice' ) . '</button>
										</div>
									</div>
								</label>
								<label class="cn-pricing-item" for="cn_pricing_plan_yearly">
									<input id="cn_pricing_plan_yearly" type="radio" name="cn_pricing_plan" value="yearly">
									<div class="cn-pricing-info">
										<div class="cn-pricing-head">
											<h4>' . __( 'Professional Yearly', 'cookie-notice' ) . '</h4>
											<span class="cn-plan-pricing"><span class="cn-plan-price"><sup>$</sup>149.50</span> / ' . __( 'year', 'cookie-notice' ) . '</span>
											<span class="cn-plan-promo">' . __( 'Best Value', 'cookie-notice' ) . '</span>
										</div>
										<div class="cn-pricing-body">
											<p class="cn-included"><span class="cn-icon"></span>' . __( 'GDPR, CCPA, ePrivacy, PECR compliance', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( 'Consent Analytics Dashboard', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Unlimited</b> visits', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Lifetime</b> consent storage', 'cookie-notice' ) . '</p>	
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Unlimited</b> languages', 'cookie-notice' ) . '</p>
											<p class="cn-included"><span class="cn-icon"></span>' . __( '<b>Premium</b> Support', 'cookie-notice' ) . '</p>
										</div>
										<div class="cn-pricing-footer">
											<button type="button" class="cn-btn cn-btn-outline">' . __( 'Select Plan', 'cookie-notice' ) . '</button>
										</div>
									</div>
								</label>
							</div>
							<div class="cn-buttons">
								<button type="button" class="cn-btn cn-btn-lg cn-btn-transparent cn-skip-button">' . __( "I don’t want to create an account now", 'cookie-notice' ) . '</button>
							</div>';
				
				
				$html .= '
						</div>
					</div>
				</div>';
	
			} elseif ( $screen == 4 ) {
				$html .= $this->welcome_screen( 'success', false );
				
				$html .= '
				<div class="cn-content cn-sidebar-visible">
					<div class="cn-inner">
						<div class="cn-content-full">
							<h1><b>' . __( 'Congratulations', 'cookie-notice' ) . '</b></h1>
							<h2>' . __( 'You are now promoting privacy with Hu-manity.co', 'cookie-notice' ) . '</h2>
							<div class="cn-lead">
								<p>' . __( 'Log in to your Cookie Compliance&trade; account and continue configuring your Privacy Experience.', 'cookie-notice' ) . '</p>
							</div>
							<div class="cn-buttons">
								<a href="' . $this->app_login_url . '" class="cn-btn cn-btn-lg" target="_blank">' . __( 'Go to Application', 'cookie-notice' ) . '</a>
							</div>
						</div>
					</div>
				</div>';
			}

			$html .= '
			</div>';
		// sidebar screens
		} elseif ( in_array( $screen, $sidebars ) ) {
			$html = '';

			if ( $screen === 'about' ) {
				$theme = wp_get_theme();

				$html .= '
				<div class="cn-sidebar cn-sidebar-left has-loader">
					<div class="cn-inner">
						<div class="cn-header">
							<div class="cn-top-bar">
								<div class="cn-logo"><img src="' . plugins_url( '../img/cookie-notice-logo.png', __FILE__ ) . '" alt="Cookie Notice logo" /></div>
							</div>	
						</div>
						<div class="cn-body">
							<h2>' . __( 'Compliance check', 'cookie-notice' ) . '</h2>
							<div class="cn-lead"><p>' . __( 'This is a Compliance Check to determine your site’s compliance with updated data processing and consent rules under GDPR, CCPA and other international data privacy laws.', 'cookie-notice' ) . '</p></div>
							<div id="cn_preview_about">
								<p>' . __( 'Site URL', 'cookie-notice' ) . ': <b>' . home_url() . '</b></p>
								<p>' . __( 'Site Name', 'cookie-notice' ) . ': <b>' . get_bloginfo( 'name' ) . '</b></p>
							</div>
							<div class="cn-compliance-check">
								<div class="cn-progressbar"><div class="cn-progress-label">' . __( 'Checking...', 'cookie-notice' ) . '</div></div>
								<div class="cn-compliance-feedback cn-hidden"></div>
								<div class="cn-compliance-results">
									<div class="cn-compliance-item"><p><span class="cn-compliance-label">' . __( 'Cookie Notice', 'cookie-notice' ) . ' </span><span class="cn-compliance-status"></span></p><p><span class="cn-compliance-desc">' . __( 'Notifies visitors that site uses cookies.', 'cookie-notice' ) . '</span></p></div>
									<div class="cn-compliance-item" style="display: none;"><p><span class="cn-compliance-label">' . __( 'Autoblocking', 'cookie-notice' ) . ' </span><span class="cn-compliance-status"></span></p><p><span class="cn-compliance-desc">' . __( 'Non-essential cookies blocked until consent is registered.', 'cookie-notice' ) . '</span></p></div>
									<div class="cn-compliance-item" style="display: none;"><p><span class="cn-compliance-label">' . __( 'Cookie Categories', 'cookie-notice' ) . ' </span><span class="cn-compliance-status"></span></p><p><span class="cn-compliance-desc">' . __( 'Separate consent requested per purpose of use.', 'cookie-notice' ) . '</span></p></div>
									<div class="cn-compliance-item" style="display: none;"><p><span class="cn-compliance-label">' . __( 'Proof-of-Consent', 'cookie-notice' ) . ' </span><span class="cn-compliance-status"></span></p><p><span class="cn-compliance-desc">' . __( 'Proof-of-consent stored in secure audit format.', 'cookie-notice' ) . '</span></p></div>
								</div>
							</div>
							' /* <div id="cn_preview_frame"><img src=" ' . esc_url( $theme->get_screenshot() ) . '" /></div>
							. '<div id="cn_preview_frame"><div id="cn_preview_frame_wrapper"><iframe id="cn_iframe_id" src="' . home_url( '/?cn_preview_mode=0' ) . '" scrolling="no" frameborder="0"></iframe></div></div> */ . '
						</div>';
			} elseif ( $screen === 'configure' ) {
				$html .= '
				<div class="cn-sidebar cn-sidebar-left has-loader cn-theme-light">
					<div class="cn-inner">
						<div class="cn-header">
							<div class="cn-top-bar">
								<div class="cn-logo"><img src="' . plugins_url( '../img/cookie-notice-logo.png', __FILE__ ) . '" alt="Cookie Notice logo" /></div>
							</div>	
						</div>
						<div class="cn-body">
							<h2>' . __( 'Live Setup', 'cookie-notice' ) . '</h2>
							<div class="cn-lead"><p>' . __( 'Configure your Cookie Notice & Compliance design and compliance features through the options below. Click Apply Setup to save the configuration and go to selecting your preferred cookie solution.', 'cookie-notice' ) . '</p></div>
							<form id="cn-form-configure" class="cn-form" action="" data-action="configure">
								<div class="cn-accordion">
									<div class="cn-accordion-item cn-form-container" tabindex="-1">
										<div class="cn-accordion-header cn-form-header"><button class="cn-accordion-button" type="button">' . __( 'Banner Compliance', 'cookie-notice' ) . '</button></div>
										<div class="cn-accordion-collapse cn-form">
											<div class="cn-form-feedback cn-hidden"></div>' .
											/*
											<div class="cn-field cn-field-select">
												<label for="cn_location">' . __( 'What is the location of your business/organization?', 'cookie-notice' ) . '​</label>
												<div class="cn-select-wrapper">
													<select id="cn_location" name="cn_location">
														<option value="0">' . __( 'Select location', 'cookie-notice' ) . '</option>';

				foreach ( Cookie_Notice()->settings->countries as $country_code => $country_name ) {
					$html .= '<option value="' . $country_code . '">' . $country_name . '</option>';
				}

				$html .= '
													</select>
												</div>
											</div>
											*/
											'
											<div id="cn_laws" class="cn-field cn-field-checkbox">
												<label>' . __( 'Select the laws that apply to your business', 'cookie-notice' ) . ':</label>
												<div class="cn-checkbox-image-wrapper">
													<label for="cn_laws_gdpr"><input id="cn_laws_gdpr" type="checkbox" name="cn_laws" value="gdpr" title="' . __( 'GDPR', 'cookie-notice' ) . '" checked><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAC/ElEQVRoge2ZzZGjMBCFmcMet4rjHjlsANQmsGRgZ7BkMGRgZ7DOYMhgnME4A08GdgZ2AujbA41HiD8JEOawXUWVXUjd73WLVqsVBB4F+OlTv3cBciB7Ng4nAV6ADHjnSz6A7bOxPQQIh94Dd43AaSFodgKkFmNOGoHEYvwySw1IgJtFFHJgC6RD4GTJnedF2jQSAUfNqzfgMFFnAnxqOi9CvNc5UwzG1CWaQede03f1Bl6MhZqxz5l0Jot97BKBRH5nc3hLCETyO52qr1LqL4wjxWm5Akd/UMaJfOzdjpUs8xvYyXp8k//RcjA7Mf01MMVdE3IjyxyfvZyMLIVEIuoarGcZJhqOgY14bJITqO8VSd/AqobZy6T2UPUbi5RSH0op9EeW5igiguVAWZ50YxKvhRoZJ4MC/maCr56iKN5GEgi139EYHVailDpqYHMgKYpir5S6a5FIvQGYIuL9B3jjXapFYnUpOgiCIAC2mpcT872+lJ4Ab1hkqfQRuHslIB9wNHa+BYHrHAToOprKJuacJSgPLH+M1HmRtLkDdkqp95aU+tqb09tthcC5No/moeLcybKpMO5KmZbPydLON3HwzagSflQD9BIid/BI4gD2OpaA2DIbBan+8qC9sD5cOxD4FADZWAJir72kkAjE8sxN4FEGF0WRT4xAVtl1/X6sCQCZlpH6wDtHYHbpIFDVUskA+HUSUEqd9eKrB/xqCVQkNmb+X4SAy8fhmEYnEbDGJanKavDCBPoPWJSnsIvk2BvlAbr3RAaEssZPYx6blN2BK2obGFGX/bBf/EsLrm7SlL3J5k73ZMGmVS9MT5Qt8T0rulGhLHViyso3sZ20uvbif1kiKl5tuFSqI/WH+Gq78HUR4dytc7CRS86fLwo078YQQ5HFXKtLEOq3NMP53lVaNpPIcs4Fy0YB9S70LNdXpgGqjW5g3AvNlvgd+DUwb6vZmHT72aY8rtY+WgN4YI5+fh3cFPUNynqz8inUt//V7OpWAnwHNuZvH/IPPeDD9c6V9FUAAAAASUVORK5CYII=" width="24" height="24"><span>' . __( 'GDPR', 'cookie-notice' ) . '</span></label>
													<label for="cn_laws_ccpa"><input id="cn_laws_ccpa" type="checkbox" name="cn_laws" value="ccpa" title="' . __( 'CCPA', 'cookie-notice' ) . '"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAwCAYAAACScGMWAAACPElEQVRYheXYvXHbMBTAcY7AEbSA79Smskp30QiqkyLaQPQE8Qb2BtEG4QZil3Ry5ZZaAO/vAqANIwSJD1LmXXD3ToVE8sf3hEcQRVEUBXADfE+Mu2LOAVSkj/q/xj0sGVcvEgeUGTAvDlgBP4CD+Vyl4HaZuNa9WRH5JSK4oZT6CZQxuN+ZOBzYqQ9mxSkYmAuzcUqpyoE0InIUkWcng1UoLresWFlrOwCwczLa2EAispczWzvcxs5YzzXWDm4bistpwk1RfCypr2yppc3BVUvDXYAtsO7OsSRcbY5bAbfArYicrYu36Ob7Fj297wx8Ncf7JwewScGJSD3S00LjOJa9p0/E1SHlDQWm4rqmHI+LAKbgGsx/y23IMbiQVUos7g2G04yjcOYEObga2InIxQNrc3FjK2MvDtP7DOQYAIvGlcBzYub+WRKNwOJw5oRDvW8Ih4icImDxOHNiX3nHcF0GDwGwZJyvvCG4aZuwB9i31lsMbu/DAXsD9IZS6kEpVQ0FoQvPHlxfaU/jR15peGbuGf3mlhqHKYF95c0dj1MCY5ZV1wUy/uT4dOB2BtykwDmyNw0QOM6EyweS9547L/AKOID7VNwcLcUdf1Jxa3T27MjaDOoZL0m4AXRJ3uZ3Pg69p9fy/pxssVYW6GdxbrvJwjXoUnZh40oTFXrT53q4EXiNtYltkCkTaDoc71v734B9z/ex7WdSXHfxzcBvYsbfKXHlECwAd0H/JZ7MjX6ZDBcy0DPYBmyHbugVe8KbbhsHbZ0AAAAASUVORK5CYII=" width="24" height="24"><span>' . __( 'CCPA', 'cookie-notice' ) . '</span></label>
												</div>
											</div>
											<div id="cn_purposes" class="cn-field cn-field-checkbox">
												<label>' . __( 'Select the type of of services your website is using', 'cookie-notice' ) . ':</label>
												<div class="cn-checkbox-wrapper">
													<label for="cn_purposes_functional"><input id="cn_purposes_functional" type="checkbox" name="cn_purposes" value="1" checked><span>' . __( 'I use personalization services on my site​', 'cookie-notice' ) . '</span></label>
													<label for="cn_purposes_analytics"><input id="cn_purposes_analytics" type="checkbox" name="cn_purposes" value="2"><span>' . __( 'I collect and analyse information about my website’s traffic', 'cookie-notice' ) . '</span></label>
													<label for="cn_purposes_marketing"><input id="cn_purposes_marketing" type="checkbox" name="cn_purposes" value="3"><span>' . __( 'I run targeted ads on my site using, for example, Google Adsense​', 'cookie-notice' ) . '</span></label>
												</div>
											</div>
											<div class="cn-field cn-field-checkbox">
												<label class="cn-asterix">' . __( 'Enable Cookie Categories (complies with GDPR Art.32)', 'cookie-notice' ) . '</label>
												<div class="cn-checkbox-wrapper">
													<label for="cn_customize_consent"><input id="cn_customize_consent" type="checkbox" name="cn_customize_consent" value="1" checked><span>' . __( 'Give your visitors the ability to customize their consent based on cookie purpose categories.', 'cookie-notice' ) . '</span></label>
												</div>
											</div>
											<div class="cn-field cn-field-checkbox">
												<label class="cn-asterix">' . __( 'Enable Autoblocking (complies with GDPR Art.7)', 'cookie-notice' ) . '</label>
												<div class="cn-checkbox-wrapper">
													<label for="cn_autoblocking"><input id="cn_customize_consent" type="checkbox" name="cn_autoblocking" value="1" checked><span>' . __( 'Automatically block 3rd party scripts before user consent.', 'cookie-notice' ) . '</span></label>
												</div>
											</div>
											<div class="cn-small">* ' . __( 'available in Cookie Compliance&trade; only', 'cookie-notice' ) . '</div>
										</div>
									</div>
									<div class="cn-accordion-item cn-form-container cn-collapsed" tabindex="-1">
										<div class="cn-accordion-header cn-form-header"><button class="cn-accordion-button" type="button">' . __( 'Banner Design', 'cookie-notice' ) . '</button></div>
										<div class="cn-accordion-collapse cn-form">
											<div class="cn-form-feedback cn-hidden"></div>
											<div class="cn-field cn-field-radio-image">
												<label>' . __( 'Select your preferred display position', 'cookie-notice' ) . '​:</label>
												<div class="cn-radio-image-wrapper">
													<label for="cn_position_bottom"><input id="cn_position_bottom" type="radio" name="cn_position" value="bottom" title="' . __( 'Bottom', 'cookie-notice' ) . '" checked><img src="' . plugins_url( '../img/layout-bottom.png', __FILE__ ) . '" width="24" height="24"></label>
													<label for="cn_position_top"><input id="cn_position_top" type="radio" name="cn_position" value="top" title="' . __( 'Top', 'cookie-notice' ) . '"><img src="' . plugins_url( '../img/layout-top.png', __FILE__ ) . '" width="24" height="24"></label>
													<label for="cn_position_left" class="cn-asterix"><input id="cn_position_left" type="radio" name="cn_position" value="left" title="' . __( 'Left', 'cookie-notice' ) . '"><img src="' . plugins_url( '../img/layout-left.png', __FILE__ ) . '" width="24" height="24"></label>
													<label for="cn_position_right" class="cn-asterix"><input id="cn_position_right" type="radio" name="cn_position" value="right" title="' . __( 'Right', 'cookie-notice' ) . '"><img src="' . plugins_url( '../img/layout-right.png', __FILE__ ) . '" width="24" height="24"></label>
													<label for="cn_position_center" class="cn-asterix"><input id="cn_position_center" type="radio" name="cn_position" value="center" title="' . __( 'Center', 'cookie-notice' ) . '"><img src="' . plugins_url( '../img/layout-center.png', __FILE__ ) . '" width="24" height="24"></label>
												</div>
											</div>
											<div class="cn-field cn-fieldset">
												<label>' . __( 'Adjust the banner color scheme', 'cookie-notice' ) . '​:</label>
												<div class="cn-checkbox-wrapper cn-color-picker-wrapper">
													<label for="cn_color_primary"><input id="cn_color_primary" class="cn-color-picker" type="checkbox" name="cn_color_primary" value="#20c19e"><span>' . __( 'Color of the buttons and interactive elements.', 'cookie-notice' ) . '</span></label>
													<label for="cn_color_background"><input id="cn_color_background" class="cn-color-picker" type="checkbox" name="cn_color_background" value="#32323a"><span>' . __( 'Color of the banner background.', 'cookie-notice' ) . '</span></label>
													<label for="cn_color_border"><input id="cn_color_border" class="cn-color-picker" type="checkbox" name="cn_color_border" value="#86858b"><span class="cn-asterix">' . __( 'Color of the borders and inactive elements.', 'cookie-notice' ) . '</span></label>
													<label for="cn_color_text"><input id="cn_color_text" class="cn-color-picker" type="checkbox" name="cn_color_text" value="#ffffff"><span class="cn-asterix">' . __( 'Color of the body text.', 'cookie-notice' ) . '</span></label>
													<label for="cn_color_heading"><input id="cn_color_heading" class="cn-color-picker" type="checkbox" name="cn_color_heading" value="#86858b"><span class="cn-asterix">' . __( 'Color of the heading text.', 'cookie-notice' ) . '</span></label>
													<label for="cn_color_button_text"><input id="cn_color_button_text" class="cn-color-picker" type="checkbox" name="cn_color_button_text" value="#ffffff"><span class="cn-asterix">' . __( 'Color of the button text.', 'cookie-notice' ) . '</span></label>
												</div>
											</div>
											<div class="cn-small">* ' . __( 'available in Cookie Compliance&trade; only', 'cookie-notice' ) . '</div>
										</div>
									</div>
								</div>
								<div class="cn-field cn-field-submit cn-nav">
									<button type="button" class="cn-btn cn-screen-button" data-screen="3"><span class="cn-spinner"></span>' . __( 'Apply Setup', 'cookie-notice' ) . '</button>
								</div>';

				$html .= wp_nonce_field( 'cn_api_configure', 'cn_nonce', true, false );

				$html .= '
							</form>
						</div>';
			} elseif ( $screen === 'register' ) {
				$html .= '
				<div class="cn-sidebar cn-sidebar-left has-loader">
					<div class="cn-inner">
						<div class="cn-header">
							<div class="cn-top-bar">
								<div class="cn-logo"><img src="' . plugins_url( '../img/cookie-notice-logo.png', __FILE__ ) . '" alt="Cookie Notice logo" /></div>
							</div>	
						</div>
						<div class="cn-body">
							<h2>' . __( 'Compliance account', 'cookie-notice' ) . '</h2>
							<div class="cn-lead">
								<p>' . __( 'Create a Cookie Compliance&trade; account and select your preferred plan.', 'cookie-notice' ) . '</p>
							</div>
							<div class="cn-accordion">
								<div id="cn-accordion-account" class="cn-accordion-item cn-form-container" tabindex="-1">
									<div class="cn-accordion-header cn-form-header"><button class="cn-accordion-button" type="button">1. ' . __( 'Create Account', 'cookie-notice' ) . '</button></div>
									<div class="cn-accordion-collapse">
										<form class="cn-form" action="" data-action="register">
											<div class="cn-form-feedback cn-hidden"></div>
											<div class="cn-field cn-field-text">
												<input type="text" name="email" value="" tabindex="1" placeholder="' . __( 'Email address', 'cookie-notice' ) . '">
											</div>
											<div class="cn-field cn-field-text">
												<input type="password" name="pass" value="" tabindex="2" autocomplete="off" placeholder="' . __( 'Password', 'cookie-notice' ) . '">
											</div>
											<div class="cn-field cn-field-text">
												<input type="password" name="pass2" value="" tabindex="3" autocomplete="off" placeholder="' . __( 'Confirm Password', 'cookie-notice' ) . '">
											</div>
											<div class="cn-field cn-field-checkbox">
												<div class="cn-checkbox-wrapper">
													<label for="cn_terms"><input id="cn_terms" type="checkbox" name="terms" value="1"><span>' . sprintf( __( 'I have read and agree to the <a href="%s" target="_blank">Terms of Service', 'cookie-notice' ), 'https://hu-manity.co/cookiecompliance-terms/' ) . '</a></span></label>
													</div>
											</div>
											<div class="cn-field cn-field-submit cn-nav">
												<button type="submit" class="cn-btn cn-screen-button" tabindex="4" data-screen="4"><span class="cn-spinner"></span>' . __( 'Sign Up', 'cookie-notice' ) . '</button>
											</div>';

				// get site language
				$locale = get_locale();
				$locale_code = explode( '_', $locale );

				$html .= '
											<input type="hidden" name="language" value="' . esc_attr( $locale_code[0] ) . '" />';

				$html .= wp_nonce_field( 'cn_api_register', 'cn_nonce', true, false );

				$html .= '
										</form>
										<p>' . __( 'Already have an account?', 'cookie-notice' ) . ' <a href="#" class="cn-screen-button" data-screen="login">' . __( 'Sign in', 'cookie-notice' ). '</a></p>
									</div>
								</div>';

				$html .= '
								<div id="cn-accordion-billing" class="cn-accordion-item cn-form-container cn-collapsed cn-disabled" tabindex="-1">
									<div class="cn-accordion-header cn-form-header">
										<button class="cn-accordion-button" type="button">2. ' . __( 'Select Plan', 'cookie-notice' ) . '</button>
									</div>
									<form class="cn-accordion-collapse cn-form cn-form-disabled" action="" data-action="payment">
										<div class="cn-form-feedback cn-hidden"></div>
										<div class="cn-field cn-field-radio">
											<div class="cn-radio-wrapper cn-plan-wrapper">
												<label for="cn_field_plan_free"><input id="cn_field_plan_free" type="radio" name="plan" value="free" checked><span><span class="cn-plan-description">' . __( 'Basic', 'cookie-notice' ) . '</span><span class="cn-plan-pricing"><span class="cn-plan-price">Free</span></span><span class="cn-plan-overlay"></span></span></label>
												<label for="cn_field_plan_monthly"><input id="cn_field_plan_monthly" type="radio" name="plan" value="monthly"><span><span class="cn-plan-description">' . __( '<b>Professional</b> Monthly', 'cookie-notice' ) . '</span><span class="cn-plan-pricing"><span class="cn-plan-price">$14.50</span>' . __( '/mo', 'cookie-notice' ) . '</span><span class="cn-plan-overlay"></span></span></label>
												<label for="cn_field_plan_yearly"><input id="cn_field_plan_yearly" type="radio" name="plan" value="yearly"><span><span class="cn-plan-description">' . __( '<b>Professional</b> Yearly', 'cookie-notice' ) . '</span><span class="cn-plan-pricing"><span class="cn-plan-price">$149.50</span>' . __( '/yr', 'cookie-notice' ) . '</span><span class="cn-plan-overlay"></span></span></label>
											</div>
										</div>
										<div class="cn-field cn-fieldset" id="cn_submit_free">
											<button type="submit" class="cn-btn cn-screen-button" tabindex="4" data-screen="4"><span class="cn-spinner"></span>' . __( 'Confirm', 'cookie-notice' ) . '</button>
										</div>
										<div class="cn-field cn-fieldset cn-hidden" id="cn_submit_paid">
											<div class="cn-field cn-field-radio">
												<label>' . __( 'Payment Method', 'cookie-notice' ) . '</label>
												<div class="cn-radio-wrapper cn-horizontal-wrapper">
													<label for="cn_field_method_credit_card"><input id="cn_field_method_credit_card" type="radio" name="method" value="credit_card" checked><span>' . __( 'Credit Card', 'cookie-notice' ) . '</span></label>
													<label for="cn_field_method_paypal"><input id="cn_field_method_paypal" type="radio" name="method" value="paypal"><span>' . __( 'PayPal', 'cookie-notice' ) . '</span></label>
												</div>
											</div>
											<div class="cn-fieldset" id="cn_payment_method_credit_card">
												<input type="hidden" name="payment_nonce" value="" />
												<div class="cn-field cn-field-text">
													<label for="cn_card_number">' . __( 'Card Number', 'cookie-notice' ) . '</label>
													<div id="cn_card_number"></div>
												</div>
												<div class="cn-field cn-field-text cn-field-half cn-field-first">
													<label for="cn_expiration_date">' . __( 'Expiration Date', 'cookie-notice' ) . '</label>
													<div id="cn_expiration_date"></div>
												</div>
												<div class="cn-field cn-field-text cn-field-half cn-field-last">
													<label for="cn_cvv">' . __( 'CVC/CVV', 'cookie-notice' ) . '</label>
													<div id="cn_cvv"></div>
												</div>
												<div class="cn-field cn-field-submit cn-nav">
													<button type="submit" class="cn-btn cn-screen-button" tabindex="4" data-screen="4"><span class="cn-spinner"></span>' . __( 'Submit', 'cookie-notice' ) . '</button>
												</div>
											</div>
											<div class="cn-fieldset" id="cn_payment_method_paypal" style="display: none;">
												<div id="cn_paypal_button"></div>
											</div>
										</div>';

				$html .= wp_nonce_field( 'cn_api_payment', 'cn_payment_nonce', true, false );

				$html .= '
									</form>
								</div>';
				
				$html .= '
							</div>
						</div>';
			} elseif ( $screen === 'login' ) {
				$html .= '
				<div class="cn-sidebar cn-sidebar-left has-loader">
					<div class="cn-inner">
						<div class="cn-header">
							<div class="cn-top-bar">
								<div class="cn-logo"><img src="' . plugins_url( '../img/cookie-notice-logo.png', __FILE__ ) . '" alt="Cookie Notice logo" /></div>
							</div>	
						</div>
						<div class="cn-body">
							<h2>' . __( 'Compliance Sign in', 'cookie-notice' ) . '</h2>
							<div class="cn-lead">
								<p>' . __( 'Sign in to your existing Cookie Compliance&trade; account and select your preferred plan.', 'cookie-notice' ) . '</p>
							</div>
							<div class="cn-accordion">
								<div id="cn-accordion-account" class="cn-accordion-item cn-form-container" tabindex="-1">
									<div class="cn-accordion-header cn-form-header"><button class="cn-accordion-button" type="button">1. ' . __( 'Account Login', 'cookie-notice' ) . '</button></div>
									<div class="cn-accordion-collapse">
										<form class="cn-form" action="" data-action="login">
											<div class="cn-form-feedback cn-hidden"></div>
											<div class="cn-field cn-field-text">
												<input type="text" name="email" value="" tabindex="1" placeholder="' . __( 'Email address', 'cookie-notice' ) . '">
											</div>
											<div class="cn-field cn-field-text">
												<input type="password" name="pass" value="" tabindex="2" autocomplete="off" placeholder="' . __( 'Password', 'cookie-notice' ) . '">
											</div>
											<div class="cn-field cn-field-submit cn-nav">
												<button type="submit" class="cn-btn cn-screen-button" tabindex="4" ' . /* data-screen="4" */ '><span class="cn-spinner"></span>' . __( 'Sign in', 'cookie-notice' ) . '</button>
											</div>';
				
				// get site language
				$locale = get_locale();
				$locale_code = explode( '_', $locale );

				$html .= '
											<input type="hidden" name="language" value="' . esc_attr( $locale_code[0] ) . '" />';

				$html .= wp_nonce_field( 'cn_api_login', 'cn_nonce', true, false );

				$html .= '
										</form>
										<p>' . __( 'Don\'t have an account yet?', 'cookie-notice' ) . ' <a href="#" class="cn-screen-button" data-screen="register">' . __( 'Sign up', 'cookie-notice' ) . '</a></p>
									</div>
								</div>';
				
				$html .= '
								<div id="cn-accordion-billing" class="cn-accordion-item cn-form-container cn-collapsed cn-disabled" tabindex="-1">
									<div class="cn-accordion-header cn-form-header">
										<button class="cn-accordion-button" type="button">2. ' . __( 'Select Plan', 'cookie-notice' ) . '</button>
									</div>
									<form class="cn-accordion-collapse cn-form cn-form-disabled" action="" data-action="payment">
										<div class="cn-form-feedback cn-hidden"></div>
										<div class="cn-field cn-field-radio">
											<div class="cn-radio-wrapper cn-plan-wrapper">
												<label for="cn_field_plan_free"><input id="cn_field_plan_free" type="radio" name="plan" value="free" checked><span><span class="cn-plan-description">' . __( 'Basic', 'cookie-notice' ) . '</span><span class="cn-plan-pricing"><span class="cn-plan-price">Free</span></span><span class="cn-plan-overlay"></span></span></label>
												<label for="cn_field_plan_monthly"><input id="cn_field_plan_monthly" type="radio" name="plan" value="monthly"><span><span class="cn-plan-description">' . __( '<b>Professional</b> Monthly', 'cookie-notice' ) . '</span><span class="cn-plan-pricing"><span class="cn-plan-price">$14.50</span>' . __( '/mo', 'cookie-notice' ) . '</span><span class="cn-plan-overlay"></span></span></label>
												<label for="cn_field_plan_yearly"><input id="cn_field_plan_yearly" type="radio" name="plan" value="yearly"><span><span class="cn-plan-description">' . __( '<b>Professional</b> Yearly', 'cookie-notice' ) . '</span><span class="cn-plan-pricing"><span class="cn-plan-price">$149.50</span>' . __( '/yr', 'cookie-notice' ) . '</span><span class="cn-plan-overlay"></span></span></label>
											</div>
										</div>
										<div class="cn-field cn-fieldset" id="cn_submit_free">
											<button type="submit" class="cn-btn cn-screen-button" tabindex="4" data-screen="4"><span class="cn-spinner"></span>' . __( 'Confirm', 'cookie-notice' ) . '</button>
										</div>
										<div class="cn-field cn-fieldset cn-hidden" id="cn_submit_paid">
											<div class="cn-field cn-field-radio">
												<label>' . __( 'Payment Method', 'cookie-notice' ) . '</label>
												<div class="cn-radio-wrapper cn-horizontal-wrapper">
													<label for="cn_field_method_credit_card"><input id="cn_field_method_credit_card" type="radio" name="method" value="credit_card" checked><span>' . __( 'Credit Card', 'cookie-notice' ) . '</span></label>
													<label for="cn_field_method_paypal"><input id="cn_field_method_paypal" type="radio" name="method" value="paypal"><span>' . __( 'PayPal', 'cookie-notice' ) . '</span></label>
												</div>
											</div>
											<div class="cn-fieldset" id="cn_payment_method_credit_card">
												<input type="hidden" name="payment_nonce" value="" />
												<div class="cn-field cn-field-text">
													<label for="cn_card_number">' . __( 'Card Number', 'cookie-notice' ) . '</label>
													<div id="cn_card_number"></div>
												</div>
												<div class="cn-field cn-field-text cn-field-half cn-field-first">
													<label for="cn_expiration_date">' . __( 'Expiration Date', 'cookie-notice' ) . '</label>
													<div id="cn_expiration_date"></div>
												</div>
												<div class="cn-field cn-field-text cn-field-half cn-field-last">
													<label for="cn_cvv">' . __( 'CVC/CVV', 'cookie-notice' ) . '</label>
													<div id="cn_cvv"></div>
												</div>
												<div class="cn-field cn-field-submit cn-nav">
													<button type="submit" class="cn-btn cn-screen-button" tabindex="4" data-screen="4"><span class="cn-spinner"></span>' . __( 'Submit', 'cookie-notice' ) . '</button>
												</div>
											</div>
											<div class="cn-fieldset" id="cn_payment_method_paypal" style="display: none;">
												<div id="cn_paypal_button"></div>
											</div>
										</div>';

				$html .= wp_nonce_field( 'cn_api_payment', 'cn_payment_nonce', true, false );

				$html .= '
									</form>
								</div>
							</div>
						</div>';
			} elseif ( $screen === 'success' ) {
				$html .= '
				<div class="cn-sidebar cn-sidebar-left has-loader">
					<div class="cn-inner">
						<div class="cn-header">
							<div class="cn-top-bar">
								<div class="cn-logo"><img src="' . plugins_url( '../img/cookie-notice-logo.png', __FILE__ ) . '" alt="Cookie Notice logo" /></div>
							</div>	
						</div>
						<div class="cn-body">
							<h2>' . __( 'Success!', 'cookie-notice' ) . '</h2>
							<div class="cn-lead"><p><b>' . __( 'You have successfully upgraded your website to Cookie Compliance&trade;', 'cookie-notice' ) . '</b></p><p>' . sprintf( __( 'Go to Cookie Compliance&trade; application now. Or access it anytime from your <a href="%s">Cookie Notice settings page</a>.', 'cookie-notice' ), esc_url( admin_url( 'admin.php?page=cookie-notice' ) ) ) . '</p></div>
						</div>';
			}

			
			$html .= '
					<div class="cn-footer">';
			/*
			switch ( $screen ) {
				case 'about':
					$html .= '<a href="' . esc_url( admin_url( 'admin.php?page=cookie-notice' ) ) . '" class="cn-btn cn-btn-link cn-skip-button">' . __( 'Skip Live Setup', 'cookie-notice' ) . '</a>';
					break;
				case 'success':
					$html .= '<a href="' . esc_url( get_dashboard_url() ) . '" class="cn-btn cn-btn-link cn-skip-button">' . __( 'WordPress Dashboard', 'cookie-notice' ) . '</a>';
					break;
				default:
					$html .= '<a href="' . esc_url( admin_url( 'admin.php?page=cookie-notice' ) ) . '" class="cn-btn cn-btn-link cn-skip-button">' . __( 'Skip for now', 'cookie-notice' ) . '</a>';
					break;
			}
			*/
			$html .= '
					</div>
				</div>
			</div>';
					
		}

		if ( $echo )
			echo $html;
		else
			return $html;

		if ( $is_ajax )
			exit();
	}
}