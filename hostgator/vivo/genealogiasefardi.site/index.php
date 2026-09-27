<?php
declare(strict_types=1);

define('BASE_PATH', __DIR__);

$configFile = BASE_PATH . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo 'Falta config.php. Copie config.sample.php o ejecute el instalador.';
    exit;
}
$GLOBALS['config'] = require $configFile;
date_default_timezone_set($GLOBALS['config']['timezone'] ?? 'America/Monterrey');

require BASE_PATH . '/src/helpers.php';
require BASE_PATH . '/src/Db.php';
require BASE_PATH . '/src/Auth.php';
require BASE_PATH . '/src/Router.php';
require BASE_PATH . '/src/controllers/AuthController.php';
require BASE_PATH . '/src/controllers/HomeController.php';
require BASE_PATH . '/src/controllers/DashboardController.php';
require BASE_PATH . '/src/controllers/PersonController.php';
require BASE_PATH . '/src/controllers/PedigreeController.php';
require BASE_PATH . '/src/controllers/SourceController.php';
require BASE_PATH . '/src/controllers/MemoryController.php';
require BASE_PATH . '/src/controllers/ProofChainController.php';
require BASE_PATH . '/src/controllers/SearchController.php';
require BASE_PATH . '/src/controllers/ArchiveController.php';
require BASE_PATH . '/src/controllers/MediaController.php';
require BASE_PATH . '/src/controllers/BiographyController.php';
require BASE_PATH . '/src/controllers/ImportController.php';

Auth::startSession();

$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';

$router = new Router();

$router->get('/login', [AuthController::class, 'loginForm']);
$router->post('/login', [AuthController::class, 'login']);
$router->post('/logout', [AuthController::class, 'logout']);
$router->get('/logout', [AuthController::class, 'logout']);
$router->get('/registro', [AuthController::class, 'registerForm']);
$router->post('/registro', [AuthController::class, 'register']);

$router->get('/', [HomeController::class, 'index']);
$router->get('/panel', [DashboardController::class, 'index']);
$router->get('/app', [DashboardController::class, 'index']);

$router->get('/archivo', [ArchiveController::class, 'index']);
$router->get('/archivo/{id}', [ArchiveController::class, 'show']);
$router->get('/pruebas', [ArchiveController::class, 'index']);

$router->get('/media/{type}/{id}', [MediaController::class, 'serve']);

$router->get('/biografias', [BiographyController::class, 'index']);
$router->get('/biografias/{slug}', [BiographyController::class, 'show']);
$router->get('/panel/biografias', [BiographyController::class, 'adminIndex']);
$router->get('/panel/biografias/{id}/edit', [BiographyController::class, 'editForm']);
$router->post('/panel/biografias/{id}', [BiographyController::class, 'update']);

$router->get('/panel/import', [ImportController::class, 'index']);
$router->post('/panel/import', [ImportController::class, 'upload']);
$router->post('/panel/import/confirm', [ImportController::class, 'confirm']);
$router->post('/panel/import/cancel', [ImportController::class, 'cancel']);

$router->get('/search', [SearchController::class, 'index']);

$router->get('/persons', [PersonController::class, 'index']);
$router->get('/persons/create', [PersonController::class, 'createForm']);
$router->post('/persons', [PersonController::class, 'store']);
$router->get('/persons/{id}', [PersonController::class, 'show']);
$router->get('/persons/{id}/edit', [PersonController::class, 'editForm']);
$router->post('/persons/{id}', [PersonController::class, 'update']);
$router->post('/persons/{id}/facts', [PersonController::class, 'addFact']);
$router->post('/persons/{id}/relationships', [PersonController::class, 'addRelationship']);
$router->post('/persons/{id}/attach-source', [PersonController::class, 'attachSource']);
$router->post('/persons/{id}/set-root', [PersonController::class, 'setRoot']);
$router->post('/persons/{id}/add-relative', [PersonController::class, 'addRelative']);

$router->get('/pedigree', [PedigreeController::class, 'index']);
$router->post('/pedigree/create-root', [PedigreeController::class, 'createRoot']);
$router->post('/pedigree/set-root', [PedigreeController::class, 'setRoot']);

$router->get('/api/sources/suggest', [SourceController::class, 'suggest']);
$router->get('/sources', [SourceController::class, 'index']);
$router->get('/sources/create', [SourceController::class, 'createForm']);
$router->post('/sources', [SourceController::class, 'store']);
$router->get('/sources/{id}', [SourceController::class, 'show']);
$router->get('/sources/{id}/edit', [SourceController::class, 'editForm']);
$router->post('/sources/{id}', [SourceController::class, 'update']);
$router->post('/sources/{id}/delete', [SourceController::class, 'destroy']);

$router->get('/memories', [MemoryController::class, 'index']);
$router->get('/memories/create', [MemoryController::class, 'createForm']);
$router->post('/memories', [MemoryController::class, 'store']);
$router->get('/memories/{id}', [MemoryController::class, 'show']);
$router->post('/memories/{id}/tags', [MemoryController::class, 'updateTags']);

$router->get('/proof-chains', [ProofChainController::class, 'index']);
$router->get('/proof-chains/create', [ProofChainController::class, 'createForm']);
$router->post('/proof-chains', [ProofChainController::class, 'store']);
$router->get('/proof-chains/{id}', [ProofChainController::class, 'show']);
$router->post('/proof-chains/{id}', [ProofChainController::class, 'update']);
$router->post('/proof-chains/{id}/links', [ProofChainController::class, 'addLink']);

try {
    $router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path);
} catch (Throwable $e) {
    if (!empty($GLOBALS['config']['debug'])) {
        throw $e;
    }
    http_response_code(500);
    view('errors/500', ['title' => 'Error', 'message' => 'Error interno del servidor.']);
}
