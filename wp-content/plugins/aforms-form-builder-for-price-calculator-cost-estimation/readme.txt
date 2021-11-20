=== AForms -- Form Builder for Price Calculator & Cost Estimation ===
Contributors: vividcolorsjp
License: MIT
Tags: price calculator, estimation, cost estimation, estimation simulation, wizard, form builder, contact, contact form, form, feedback, conditional logic
Requires at least: 4.6
Tested up to: 5.8
Requires PHP: 5.6
Stable tag: 2.1.12

Form builder for Cost estimation and Custom order.

== Description ==

**AForms -- Form Builder for Price Calculator & Cost Estimation** is a form builder that attracts customers, promotes understanding of your products or services, and leads to applications.
You can create price simulation forms or custom order forms.

== Feature List ==

- 60KB (no gzip) JavaScript program. Loaded with no-slowness
- 100% Responsive & mobile friendly
- Browsers support: Chrome, Firefox, Edge, IE11, iOS Safari, Android Chrome
- Wizard-style navigation and flow-style (in-document-style) navigation
- Dynamic calculation of unit price (+ - * / etc)
- Realtime estimation display
- Instant validation (Realtime validation)
- Online form builder
- Intuitive conditional logic by "Labelling Logic"
- Flexible tax treatment (tax-inclusion, multiple tax rate, fraction processing)
- Supports confirmation screen
- Thank-you mails & notification mails

Also you can upgrade your quotation form by using [extension softwares](https://a-forms.com/en/category/ext/).

- PDF: Automatic issuance of PDF quotations
- style: Customize the look and layout of the form
- upload: Upload files from the form

== Demo ==

- [Demo1](https://a-forms.com/en/demo1/) -- BTO-PC Online Order Wizard
- [Demo2](https://a-forms.com/en/demo2/) -- Humberger Shop Price Estimation (no submission)
- [Demo3](https://a-forms.com/en/demo3/) -- Contact Form (no estimation)
- [Demo5](https://a-forms.com/en/demo5/) -- Legal Fee (calculated unit price)
- [Demo6](https://a-forms.com/en/demo6/) -- Book Printing and Binding (calculated unit price)
- [Demo7](https://a-forms.com/en/demo7/) -- Reform of Washstand (Example of an actual product on sale)

For japanese speakers

- [Demo1](https://a-forms.com/ja/demo1/) -- BTO-PC Online Order Wizard
- [Demo2](https://a-forms.com/ja/demo2/) -- Humberger Shop Price Estimation (no submission)
- [Demo3](https://a-forms.com/ja/demo3/) -- Contact Form (no estimation)
- [Demo5](https://a-forms.com/ja/demo5/) -- Legal Fee (calculated unit price)
- [Demo6](https://a-forms.com/ja/demo6/) -- Book Printing and Binding (calculated unit price)
- [Demo7](https://a-forms.com/ja/demo7/) -- Reform of Washstand (Example of an actual product on sale)

== Screenshots ==

1. Form Settings at admin page
2. Form List at admin page
3. "General" tab of form editor at admin
4. "Details" tab of form editor
5. "Attributes" tab of form editor
6. "Mail" tab of form editor
7. Order List

== Localizations ==

AForms supports the following languages. Thank you, those who translated.

- Japanese (ja) - vividcolors, inc.
- Slovak (sk_SK) - Marek Duda
- Polish (pl_PL) - Michal Zielinski

== Support ==

You can find some guides on [AForm's official website](https://a-forms.com/en/).
If you have any problems or feature requests for this plugin, also requests for installation or customization, please feel free to [contact us](https://a-forms.com/en/contact/).

== Changelog ==

= 2.1.12 =
* Fixed Option style
* Upgrade the build environment

= 2.1.11 =
* Fixed a bug that prevented opening certain order data in the order list screen

= 2.1.10 =
* Fixed a bug in which item images were displayed too large

= 2.1.9 =
* Improve the style of the form
* Fix a bug that prevented scrolling to the target element when a validation error occurred
* Fix a bug that prevented changes to the amount format from being reflected

= 2.1.8 =
* Add MIN(), MAX(), SWITCH() to expression

= 2.1.7 =
* Fix a bug regarding the display of errors in wizard style
* Add WordPress5.8 support

= 2.1.6 =
* Fix a bug that occurred when using multiple AutoQuantity items
* Improve smartphone display of the quotation table

= 2.1.5 =
* Improve handling of errors due to authorization, etc
* Improve the form loading process (for better interoperability with Elementor, etc.)

= 2.1.4 =
* Add some hooks for extensions

= 2.1.3 =
* Enhance the ability to work with extensions
* Fix a bug that the dialog on forms were not displayed properly in IE
* Fix a bug in displaying Option with Quantity

= 2.1.2 =
* Fix a bug where Slider values were not reflected in the details

= 2.1.1 =
* Fix a bug that prevented Option with Quantity from being saved
* Fix a bug in the quantity choices offered by Option with Quantity
* Change dialogs to those of AForms
* Fix a problem of not being able to open another window on iOS

= 2.1.0 =
* Fix bugs in v2.1.0-rc.3

= 2.1.0-rc.3 =
* Add QuantityWatcher component, for conditional branching by quantities
* Add Option with Quanaity component
* Add label negation support in "Required Labels"
* Add unit price calculation facility in Auto Item
* Add Auto Quanaity component, which also calculates its value
* Add Adjustment component, for discounts and premiums
* Add Stop component, to stop form submission

= 2.0.6 =
* Fix an incompatibility with old libxml
* Add WordPress5.7 support
* Fix error messages on Selector item not disappearing
* Fix the behavior of Quantity item on Firefox

= 2.0.5 =
* Fix a bug in the handling of fields that allow optional input of numerical values

= 2.0.4 =
* Add asset versioning again
* Improve the behavior of Slider item
* Improve the ability to freely place Quantity items and Slider items
* Improve the administration screen so that any number of Options can be displayed properly
* Fix an issue that prevented the display of forms where the author of that has been deleted

= 2.0.3 =
* Fix a bug on Auto item of form builder
* Fix filters for rules and word to be applied strictly
* Add an api for extensions

= 2.0.2 =
* Fix a behavior of reCAPTCHA v3 item
* Fix a minor bug
* Add WordPress5.6 support

= 2.0.1 =
* Add asset versioning
* Now inserts the sample form conditionally

= 2.0.0 =
* Add support for multiple tax rates
* Improve the content of order data
* Move word settings to admin screen
* Improve multi-language and multi-currency support
* Remove the treatment of settings file (.toml file)
* Enhance filters
* Remove "Price Checker" Items
* Add functionality to not add Option to estimation details

= 1.2.15 =
* Improve server interoperability
* Improve the ordering screen
* Fix bugs on the form builder
* Add a class when the image is empty
* Add behavior settings
* Add WordPress5.5 support

= 1.2.14 =
* Fix the behavior of Multiple-Checkbox item

= 1.2.13 =
* Add Slider item
* Add Polish language support
* Fix the behavior when options cannot be selected
* Fix the behavior when a Quantity item is not displayed
* Fix an issue with the submit button being displayed inappropriately
* Improve the behavior of checkbox and radio buttons

= 1.2.12 =
* Fix a bug where Quantity Items could not be settled

= 1.2.11 =
* Fix a bug on php5.6
* Add WordPress4.6 support

= 1.2.10 = 
* Add ribbons support to Options
* Improve a behavior of menu on Dashboard
* Improve a behavior of Options when disabled on Edge
* Improve a behavior of Wizard style navigation

= 1.2.9 =
* Fix an inconsistency on handling customized words

= 1.2.8 =
* Fix a problem in a sample of the settings file

= 1.2.7 =
* Add Slovak language support
* Migrate the settings-file format from .ini to .toml. (.ini format will be supported for the time being)
* Fix a bug around mathematical calculation on IE11

= 1.2.6 =
* Fix a bug

= 1.2.5 =
* Add Multiple-Checkbox component

= 1.2.4 =
* Replace PriceChecker with PriceWatcher, which supports range specification
* Fix some minor bugs

= 1.2.3 =
* Support ini-for-each-form 
* Improve default style
* Support "optional" badge
* Support Hiragana/Katakana input on Name Component
* Fix some minor bugs

= 1.2.2 =
* Add Address complement (by YubinBango) functionality
* Improve thank-you mail
* Improve default style
* Improve behaviors around scrolling
* Fix some minor bugs

= 1.2.1 =
* Fix a bug on deleting Quantity item
* Support incomplete ini files

= 1.2.0 =
* Change icons
* Add initial value for Checkbox and RadioButton
* Add Dropdown
* Add reCAPTCHA v3

= 1.1.0 =
* Fix some bugs.
* Improve builtin style.
* Add Quantity component.

= 1.0.1 =
* Update documentation.
* Add icon and banner.

= 1.0.0 =
* First release.