    <div class="wq-Help">
      <?php
        $guide = '<a href="' . esc_attr(__('https://a-forms.com/en/category/guide/', 'aforms')) . '" target="_blank">';
        $forum = '<a href="https://wordpress.org/support/plugin/aforms-form-builder-for-price-calculator-cost-estimation/" target="_blank">';
        $ext = '<a href="' . esc_attr(__('https://a-forms.com/en/category/ext/', 'aforms')) . '" target="_blank">';
      ?>
      <h4 class="wq--title"><?= esc_html(__('Support Information', 'aforms')) ?></h4>
      <div class="wq--body">
        <p><?= sprintf(esc_html(__('We have prepared %sguide pages%s on our official website. Please take a look.', 'aforms')), $guide, '</a>') ?><br />
        <?= sprintf(esc_html(__('For questions, requests for new features, and bug reports, please use %sthe support form%s.', 'aforms')), $forum, '</a>') ?></p>
      </div>
      <hr />
      <h4 class="wq--title"><?= esc_html(__('Extend AForms', 'aforms')) ?></h4>
      <div class="wq--body">
        <p><?= sprintf(esc_html(__('You can upgrade your quotation form by using %sextension softwares%s.', 'aforms')), $ext, '</a>') ?></p>
        <ul class="ul-disc">
          <li><?= esc_html(__('Automatic issuance of PDF quotations', 'aforms')) ?></li>
          <li><?= esc_html(__('Customize the look and layout', 'aforms')) ?></li>
          <li><?= esc_html(__('Upload files from the form', 'aforms')) ?></li>
        </ul>
      </div>
    </div>