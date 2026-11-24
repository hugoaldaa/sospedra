<?php
// Cargar variables de entorno desde .env
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorar comentarios
        if (strpos(trim($line), '#') === 0) continue;
        
        // Parsear KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
    return true;
}

// Cargar .env desde el directorio raíz (un nivel arriba de bd/)
loadEnv(__DIR__ . '/../.env');

$host = getenv('DB_HOST');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');
$db   = getenv('DB_NAME');

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => $conn->connect_error]));
}

$conn->set_charset("utf8");
header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : 'catalog';
$lang = isset($_GET['lang']) && $_GET['lang'] == 'ca' ? 'ca' : 'es';

if ($action == 'catalog') {
    $res = $conn->query("SELECT p.id, p.imagen, p.id_tipo_prenda,
                         p.nombre_$lang as nombre, 
                         t.nombre_$lang as tipo_nombre 
                         FROM prendas p
                         LEFT JOIN tipos_de_prendas t ON p.id_tipo_prenda = t.id");
    
    $prendas = [];
    while($row = $res->fetch_assoc()) $prendas[] = $row;
    
    $tipos = [];
    $resT = $conn->query("SELECT id, nombre_$lang as nombre FROM tipos_de_prendas");
    while($t = $resT->fetch_assoc()) $tipos[] = $t;

    echo json_encode(["prendas" => $prendas, "tipos" => $tipos]);
}

if ($action == 'detail') {
    $id = intval($_GET['id']);
    $res = $conn->query("SELECT p.id, p.imagen, p.id_tipo_prenda,
                         p.nombre_$lang as nombre, 
                         t.nombre_$lang as tipo_nombre 
                         FROM prendas p 
                         LEFT JOIN tipos_de_prendas t ON p.id_tipo_prenda = t.id 
                         WHERE p.id = $id");
    
    $prenda = $res->fetch_assoc();
    if ($prenda) {
        $resI = $conn->query("SELECT ruta FROM prendas_imagenes WHERE id_prenda = $id ORDER BY orden ASC");
        $imagenes = [];
        while($img = $resI->fetch_assoc()) $imagenes[] = $img['ruta'];
        
        if (empty($imagenes)) $imagenes = [$prenda['imagen']];
        $prenda['todas_imagenes'] = $imagenes;

        echo json_encode($prenda);
    }
}
$conn->close();