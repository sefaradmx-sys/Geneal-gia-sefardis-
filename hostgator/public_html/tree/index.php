<?php
declare(strict_types=1);

$route = "/sefarad-mx/tree/sefarad";
$target = "https://genealogiasefardi.site/sefarad-mx/index.php?route=" . rawurlencode($route);
header("Location: " . $target, true, 302);
header("Cache-Control: no-store");
exit;
