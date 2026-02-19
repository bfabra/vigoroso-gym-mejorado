const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function initDatabase() {
  let connection;

  try {
    console.log('🔧 Iniciando configuración de base de datos...');

    // Conectar sin especificar base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado a MySQL');

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'vigoroso_gym'}`);
    console.log(`✅ Base de datos '${process.env.DB_NAME || 'vigoroso_gym'}' creada/verificada`);

    await connection.query(`USE ${process.env.DB_NAME || 'vigoroso_gym'}`);

    // Crear tabla de usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'entrenador') DEFAULT 'entrenador',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('✅ Tabla usuarios creada');

    // Crear tabla de participantes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS participantes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        fecha_nacimiento DATE,
        genero ENUM('M', 'F', 'Otro'),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        usuario_creador_id INT,
        FOREIGN KEY (usuario_creador_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabla participantes creada');

    // Crear tabla de planes de entrenamiento
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planes_entrenamiento (
        id INT PRIMARY KEY AUTO_INCREMENT,
        participante_id INT NOT NULL,
        mes_año VARCHAR(7) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        creado_por INT,
        notas TEXT,
        FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
        UNIQUE KEY unique_plan_mes (participante_id, mes_año)
      )
    `);
    console.log('✅ Tabla planes_entrenamiento creada');

    // Crear tabla de ejercicios del plan
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ejercicios_plan (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plan_id INT NOT NULL,
        dia_semana ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado') NOT NULL,
        orden INT NOT NULL,
        nombre_ejercicio VARCHAR(200) NOT NULL,
        series VARCHAR(20),
        repeticiones VARCHAR(20),
        notas TEXT,
        imagenes_url TEXT DEFAULT NULL,
        FOREIGN KEY (plan_id) REFERENCES planes_entrenamiento(id) ON DELETE CASCADE,
        INDEX idx_plan_dia (plan_id, dia_semana)
      )
    `);
    console.log('✅ Tabla ejercicios_plan creada');

    // Crear tabla de registros de entrenamiento
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registros_entrenamiento (
        id INT PRIMARY KEY AUTO_INCREMENT,
        participante_id INT NOT NULL,
        ejercicio_plan_id INT NOT NULL,
        fecha_registro DATE NOT NULL,
        peso_utilizado DECIMAL(6,2),
        series_completadas INT,
        repeticiones_completadas INT,
        comentarios TEXT,
        fecha_hora_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
        FOREIGN KEY (ejercicio_plan_id) REFERENCES ejercicios_plan(id) ON DELETE CASCADE,
        INDEX idx_participante_fecha (participante_id, fecha_registro)
      )
    `);
    console.log('✅ Tabla registros_entrenamiento creada');

    // ═══════════════════════════════════════════════════
    // SISTEMA DINÁMICO DE PLANTILLAS (nuevo)
    // ═══════════════════════════════════════════════════

    // Catálogo de ejercicios (compartido, sin duplicación)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS catalogo_ejercicios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(200) NOT NULL,
        grupo_muscular ENUM('Pecho','Espalda','Hombros','Piernas','Brazos','Core','Cardio','Movilidad','Gluteo') NOT NULL,
        instrucciones TEXT,
        imagen_1_url VARCHAR(500) DEFAULT NULL,
        imagen_2_url VARCHAR(500) DEFAULT NULL,
        imagen_3_url VARCHAR(500) DEFAULT NULL,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_nombre (nombre),
        INDEX idx_grupo_muscular (grupo_muscular)
      )
    `);
    console.log('✅ Tabla catalogo_ejercicios creada');

    // Plantillas reutilizables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plantillas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(200) NOT NULL,
        categoria ENUM('MUJERES','HOMBRES','NINOS','ADULTO_MAYOR') NOT NULL,
        descripcion TEXT,
        objetivo VARCHAR(200),
        nivel ENUM('Principiante','Intermedio','Avanzado') DEFAULT 'Intermedio',
        activo BOOLEAN DEFAULT TRUE,
        creado_por INT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_categoria_activo (activo, categoria)
      )
    `);
    console.log('✅ Tabla plantillas creada');

    // Días de cada plantilla
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plantilla_dias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plantilla_id INT NOT NULL,
        numero_dia INT NOT NULL,
        nombre_dia VARCHAR(100) NOT NULL,
        descripcion TEXT,
        FOREIGN KEY (plantilla_id) REFERENCES plantillas(id) ON DELETE CASCADE,
        UNIQUE KEY unique_plantilla_dia (plantilla_id, numero_dia)
      )
    `);
    console.log('✅ Tabla plantilla_dias creada');

    // Ejercicios de cada día (referencia al catálogo)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plantilla_dia_ejercicios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plantilla_dia_id INT NOT NULL,
        ejercicio_id INT NOT NULL,
        orden INT NOT NULL,
        series VARCHAR(20),
        repeticiones VARCHAR(20),
        notas TEXT,
        FOREIGN KEY (plantilla_dia_id) REFERENCES plantilla_dias(id) ON DELETE CASCADE,
        FOREIGN KEY (ejercicio_id) REFERENCES catalogo_ejercicios(id) ON DELETE RESTRICT,
        UNIQUE KEY unique_dia_orden (plantilla_dia_id, orden)
      )
    `);
    console.log('✅ Tabla plantilla_dia_ejercicios creada');

    // Asignaciones de plantilla a participante por mes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS asignaciones_plan (
        id INT PRIMARY KEY AUTO_INCREMENT,
        participante_id INT NOT NULL,
        plantilla_id INT NOT NULL,
        mes_anio VARCHAR(7) NOT NULL,
        notas_entrenador TEXT,
        asignado_por INT,
        fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
        FOREIGN KEY (plantilla_id) REFERENCES plantillas(id) ON DELETE RESTRICT,
        FOREIGN KEY (asignado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_participante_mes (participante_id, mes_anio)
      )
    `);
    console.log('✅ Tabla asignaciones_plan creada');

    // Snapshot de días (copia inmutable al asignar)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plan_snapshot_dias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        asignacion_id INT NOT NULL,
        numero_dia INT NOT NULL,
        nombre_dia VARCHAR(100) NOT NULL,
        dia_semana ENUM('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado') NOT NULL,
        FOREIGN KEY (asignacion_id) REFERENCES asignaciones_plan(id) ON DELETE CASCADE,
        UNIQUE KEY unique_asignacion_dia (asignacion_id, numero_dia)
      )
    `);
    console.log('✅ Tabla plan_snapshot_dias creada');

    // Snapshot de ejercicios (copia desnormalizada inmutable)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plan_snapshot_ejercicios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        snapshot_dia_id INT NOT NULL,
        ejercicio_catalogo_id INT,
        orden INT NOT NULL,
        nombre_ejercicio VARCHAR(200) NOT NULL,
        series VARCHAR(20),
        repeticiones VARCHAR(20),
        notas TEXT,
        imagen_1_url VARCHAR(500),
        imagen_2_url VARCHAR(500),
        imagen_3_url VARCHAR(500),
        FOREIGN KEY (snapshot_dia_id) REFERENCES plan_snapshot_dias(id) ON DELETE CASCADE,
        FOREIGN KEY (ejercicio_catalogo_id) REFERENCES catalogo_ejercicios(id) ON DELETE SET NULL,
        UNIQUE KEY unique_snapshot_orden (snapshot_dia_id, orden)
      )
    `);
    console.log('✅ Tabla plan_snapshot_ejercicios creada');

    // Registros de entrenamiento v2 (vinculados a snapshots)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registros_entrenamiento_v2 (
        id INT PRIMARY KEY AUTO_INCREMENT,
        participante_id INT NOT NULL,
        snapshot_ejercicio_id INT NOT NULL,
        fecha_registro DATE NOT NULL,
        peso_utilizado DECIMAL(6,2),
        series_completadas INT,
        repeticiones_completadas INT,
        comentarios TEXT,
        fecha_hora_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
        FOREIGN KEY (snapshot_ejercicio_id) REFERENCES plan_snapshot_ejercicios(id) ON DELETE CASCADE,
        INDEX idx_participante_fecha (participante_id, fecha_registro)
      )
    `);
    console.log('✅ Tabla registros_entrenamiento_v2 creada');

    // ═══════════════════════════════════════════════════
    // TABLAS LEGACY (se mantienen para compatibilidad)
    // ═══════════════════════════════════════════════════

    // Crear tabla de planes de nutrición
    await connection.query(`
      CREATE TABLE IF NOT EXISTS planes_nutricion (
        id INT PRIMARY KEY AUTO_INCREMENT,
        participante_id INT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        creado_por INT,
        recomendaciones_generales TEXT,
        activo BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabla planes_nutricion creada');

    // Crear tabla de comidas del plan
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comidas_plan (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plan_nutricion_id INT NOT NULL,
        tipo_comida ENUM('Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Cena') NOT NULL,
        opcion_1 TEXT,
        opcion_2 TEXT,
        FOREIGN KEY (plan_nutricion_id) REFERENCES planes_nutricion(id) ON DELETE CASCADE,
        INDEX idx_plan_tipo (plan_nutricion_id, tipo_comida)
      )
    `);
    console.log('✅ Tabla comidas_plan creada');

    // Verificar si existe el usuario admin
    const [adminExists] = await connection.query(
      "SELECT id FROM usuarios WHERE email = 'admin@gmail.com'"
    );

    if (adminExists.length === 0) {
      // Crear usuario administrador
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        ['Administrador VIGOROSO', 'admin@gmail.com', hashedPassword, 'admin']
      );
      console.log('✅ Usuario administrador creado');
      console.log('   Email: admin@gmail.com');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ Base de datos configurada          ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initDatabase;
