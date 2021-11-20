
<?php
$sidebarSelector = $resolve('options')->extendSidebarSelector('', $output['id']);
?>
<?php if ($sidebarSelector): ?>
<div style="margin:10px; display:flex;">
  <div id="sidebar-for-preview" style="width:25%; min-width:250px; max-width:350px; flex: 1 1 25%;"></div>
  <div style="margin-left:20px; flex: 3 3 70%; width:70%;">
    <?= do_shortcode('[aforms-form id="'.$output['id'].'" mode="preview"]') ?>
  </div>
</div>
<?php else: ?>
<div style="margin:10px;">
  <?= do_shortcode('[aforms-form id="'.$output['id'].'" mode="preview"]') ?>
</div>
<?php endif; ?>
