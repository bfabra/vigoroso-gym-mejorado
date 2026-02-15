import React, { useState, useEffect } from 'react';
import { entrenamientoService } from '../../services/api';
import {
  DumbbellIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '../common/Icons';
import { EJERCICIOS_COMUNES } from '../../constants/ejercicios';
import {
  PLANTILLAS_POR_CATEGORIA,
  CATEGORIAS_PLANTILLAS,
  DIAS_SEMANA
} from '../../constants/plantillas';

function TrainingPlanManager({ participantId, userId }) {
  const [plan, setPlan] = useState(null);
  const [ejercicios, setEjercicios] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);
  const [showEjerciciosList, setShowEjerciciosList] = useState(null);
  const [showPlantillas, setShowPlantillas] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCategory, setSelectedCategory] = useState('MUJERES'); // Categoría por defecto

  const currentMonth = selectedMonth; // Para mantener compatibilidad con el código existente
  const dias = DIAS_SEMANA;

  useEffect(() => {
    loadPlan();
  }, [participantId, selectedMonth]); // Recargar cuando cambie el mes seleccionado

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEjerciciosList && !event.target.closest('.ejercicio-dropdown-container')) {
        setShowEjerciciosList(null);
      }
    };

    if (showEjerciciosList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEjerciciosList]);

  const loadPlan = async () => {
    console.log('🔵 loadPlan INICIANDO');
    console.log('participantId:', participantId);
    console.log('selectedMonth:', selectedMonth);
    console.log('currentMonth:', currentMonth);
    console.log('URL que se llamará:', `/api/entrenamiento/plan/${participantId}/${selectedMonth}`);

    try {
      console.log('📡 Llamando a entrenamientoService.obtenerPlan...');
      const data = await entrenamientoService.obtenerPlan(participantId, selectedMonth);
      console.log('📦 Datos recibidos del servidor:', JSON.stringify(data, null, 2));

      setPlan(data.plan);
      console.log('✅ Plan seteado:', data.plan);

      // SIEMPRE crear estructura completa de 36 ejercicios (6 días × 6 ejercicios)
      console.log('📝 Creando estructura completa de ejercicios...');
      const todosEjercicios = [];
      dias.forEach(dia => {
        for (let i = 1; i <= 6; i++) {
          todosEjercicios.push({
            dia_semana: dia,
            orden: i,
            nombre_ejercicio: '',
            series: '',
            repeticiones: '',
            notas: '',
            imagenes_url: []
          });
        }
      });
      console.log(`✅ Estructura base creada: ${todosEjercicios.length} ejercicios`);

      // Si hay ejercicios guardados, reemplazar en las posiciones correspondientes
      if (data.ejercicios && data.ejercicios.length > 0) {
        console.log(`📥 Integrando ${data.ejercicios.length} ejercicios guardados...`);
        data.ejercicios.forEach(ejGuardado => {
          const index = todosEjercicios.findIndex(e =>
            e.dia_semana === ejGuardado.dia_semana && e.orden === ejGuardado.orden
          );
          if (index !== -1) {
            // Parsear imagenes_url: puede venir como string JSON o array
            let imagenesUrl = [];
            if (ejGuardado.imagenes_url) {
              imagenesUrl = typeof ejGuardado.imagenes_url === 'string'
                ? JSON.parse(ejGuardado.imagenes_url)
                : ejGuardado.imagenes_url;
            }
            todosEjercicios[index] = {
              ...ejGuardado,
              nombre_ejercicio: String(ejGuardado.nombre_ejercicio || ''),
              series: String(ejGuardado.series || ''),
              repeticiones: String(ejGuardado.repeticiones || ''),
              notas: String(ejGuardado.notas || ''),
              imagenes_url: imagenesUrl
            };
          }
        });
        console.log(`✅ Ejercicios integrados. Total: ${todosEjercicios.length}`);
      } else {
        console.log('📝 No hay ejercicios guardados, usando estructura vacía');
      }

      setEjercicios(todosEjercicios);
    } catch (error) {
      console.error('❌ ERROR en loadPlan:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      // Si es 404, simplemente no hay plan, crear vacío
      if (error.response?.status === 404) {
        console.log('⚠️ 404: No existe plan para este mes. Inicializando vacío...');
        setPlan(null);
      }

      // IMPORTANTE: Incluso si hay error, inicializar ejercicios vacíos
      const emptyEjercicios = [];
      dias.forEach(dia => {
        for (let i = 1; i <= 6; i++) {
          emptyEjercicios.push({
            dia_semana: dia,
            orden: i,
            nombre_ejercicio: '',
            series: '',
            repeticiones: '',
            notas: '',
            imagenes_url: []
          });
        }
      });
      console.log(`✅ Estructura vacía creada: ${emptyEjercicios.length} ejercicios`);
      setEjercicios(emptyEjercicios);
    } finally {
      setLoading(false);
      console.log('🔵 loadPlan FINALIZADO');
    }
  };

  const handleSave = async () => {
    try {
      console.log('=== INICIANDO GUARDADO ===');
      console.log('Ejercicios totales:', ejercicios.length);
      console.log('⚠️ MES QUE SE GUARDARÁ:', selectedMonth);
      console.log('⚠️ currentMonth:', currentMonth);
      console.log('Estado actual de ejercicios:', ejercicios);

      const ejerciciosConDatos = ejercicios.filter(e => e.nombre_ejercicio && e.nombre_ejercicio.trim() !== '');

      console.log('Ejercicios con datos:', ejerciciosConDatos.length);
      console.log('Ejercicios a guardar:', ejerciciosConDatos);

      if (ejerciciosConDatos.length === 0) {
        alert('Debes agregar al menos un ejercicio.\n\nAsegúrate de:\n1. Hacer clic en "Editar Plan"\n2. Seleccionar o escribir ejercicios\n3. Los ejercicios deben tener nombre');
        return;
      }

      console.log('Enviando al servidor:', {
        participante_id: participantId,
        mes_año: selectedMonth,
        ejercicios: ejerciciosConDatos
      });

      const response = await entrenamientoService.guardarPlan({
        participante_id: participantId,
        mes_año: selectedMonth,
        ejercicios: ejerciciosConDatos
      });

      console.log('✅ RESPUESTA DEL SERVIDOR:', response);
      console.log('✅ Plan ID retornado:', response.plan_id);
      console.log('✅ Mensaje:', response.message);

      setEditing(false);

      // Esperar un poco antes de recargar para asegurar que la BD se actualizó
      console.log('⏳ Esperando 500ms antes de recargar...');
      await new Promise(resolve => setTimeout(resolve, 500));

      loadPlan();
      alert(`Plan guardado exitosamente ✅\n\nMes: ${selectedMonth}\nEjercicios: ${ejerciciosConDatos.length}\nPlan ID: ${response.plan_id || 'N/A'}`);
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      console.error('Detalles del error:', error.response?.data);
      alert('Error al guardar el plan: ' + (error.response?.data?.error || error.message));
    }
  };

  const updateEjercicio = (dia, orden, field, value) => {
    setEjercicios(prev => prev.map(e =>
      e.dia_semana === dia && e.orden === orden
        ? { ...e, [field]: value }
        : e
    ));
  };

  const seleccionarEjercicio = (dia, orden, nombreEjercicio) => {
    updateEjercicio(dia, orden, 'nombre_ejercicio', nombreEjercicio);
    setShowEjerciciosList(null);
  };

  const handleImageUpload = async (dia, orden, file) => {
    try {
      const ejercicio = ejercicios.find(e => e.dia_semana === dia && e.orden === orden);
      const currentImages = ejercicio?.imagenes_url || [];
      if (currentImages.length >= 3) {
        alert('Máximo 3 imágenes por ejercicio');
        return;
      }
      const result = await entrenamientoService.subirImagenEjercicio(file);
      updateEjercicio(dia, orden, 'imagenes_url', [...currentImages, result.imagen_url]);
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir imagen: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleImageRemove = async (dia, orden, imagen_url, index) => {
    try {
      await entrenamientoService.eliminarImagenEjercicio(imagen_url);
    } catch (error) {
      console.error('Error eliminando imagen del servidor:', error);
    }
    const ejercicio = ejercicios.find(e => e.dia_semana === dia && e.orden === orden);
    const newImages = (ejercicio?.imagenes_url || []).filter((_, i) => i !== index);
    updateEjercicio(dia, orden, 'imagenes_url', newImages);
  };

  const aplicarPlantilla = (dia, plantillaNombre) => {
    try {
      console.log('🔵 INICIO aplicarPlantilla');
      console.log('Parámetros recibidos:', { dia, plantillaNombre, categoria: selectedCategory });

      const plantilla = PLANTILLAS_POR_CATEGORIA[selectedCategory]?.[plantillaNombre];
      if (!plantilla) {
        console.error('❌ Plantilla no encontrada:', plantillaNombre);
        console.log('Plantillas disponibles:', Object.keys(PLANTILLAS_POR_CATEGORIA[selectedCategory] || {}));
        alert('Error: Plantilla no encontrada');
        return;
      }

      console.log('=== APLICANDO PLANTILLA ===');
      console.log('📋 Plantilla:', plantillaNombre);
      console.log('📅 Día:', dia);
      console.log('🏋️ Ejercicios en plantilla:', plantilla.length);

      // Convertir plantilla a string de forma segura
      try {
        console.log('📦 Plantilla completa:', JSON.stringify(plantilla, null, 2));
      } catch (e) {
        console.log('📦 Plantilla (no JSON):', plantilla);
      }

      // VALIDACIÓN 1: Verificar que el estado tiene ejercicios
      if (!ejercicios || ejercicios.length === 0) {
        console.error('❌ ERROR CRÍTICO: El estado "ejercicios" está vacío!');
        console.log('Estado actual de ejercicios:', ejercicios);
        alert('Error: No hay ejercicios en el estado.\n\nPor favor:\n1. Recarga la página (F5)\n2. Vuelve a seleccionar el participante\n3. Intenta de nuevo');
        return;
      }

      console.log('📝 Estado ejercicios ANTES:', ejercicios.length);
      const ejerciciosDelDiaAntes = ejercicios.filter(e => e.dia_semana === dia);
      console.log(`Ejercicios del día "${dia}" ANTES:`, ejerciciosDelDiaAntes.length);

      // VALIDACIÓN 2: Verificar que existen ejercicios para ese día
      if (ejerciciosDelDiaAntes.length === 0) {
        console.error(`❌ ERROR: No hay ejercicios para el día "${dia}"`);
        const diasUnicos = [...new Set(ejercicios.map(e => e.dia_semana))];
        console.log('Días disponibles en ejercicios:', diasUnicos);
        console.log('Días configurados:', dias);
        alert(`Error: No se encontraron ejercicios para "${dia}".\n\nDías disponibles: ${diasUnicos.join(', ')}\n\nVerifica que los nombres coincidan.`);
        return;
      }

      // IMPORTANTE: Crear un nuevo array usando map de forma segura
      console.log('🔄 Creando nuevo array de ejercicios...');
      let ejerciciosActualizados = 0;

      const nuevosEjercicios = [];

      for (let i = 0; i < ejercicios.length; i++) {
        const ejercicio = ejercicios[i];

        // Si este ejercicio pertenece al día seleccionado
        if (ejercicio.dia_semana === dia) {
          // Buscar datos de plantilla para este orden
          const datosPlantilla = plantilla[ejercicio.orden - 1];

          if (datosPlantilla) {
            console.log(`✏️ ${i}) Actualizando ${dia} - Ejercicio ${ejercicio.orden}:`, {
              antes: ejercicio.nombre_ejercicio || '(vacío)',
              nombre: datosPlantilla.nombre,
              series: datosPlantilla.series,
              reps: datosPlantilla.reps
            });

            ejerciciosActualizados++;

            // Crear nuevo objeto con datos de la plantilla (preservar imagen existente)
            nuevosEjercicios.push({
              dia_semana: dia,
              orden: ejercicio.orden,
              nombre_ejercicio: String(datosPlantilla.nombre || ''),
              series: String(datosPlantilla.series || ''),
              repeticiones: String(datosPlantilla.reps || ''),
              notas: String(datosPlantilla.notas || ''),
              imagenes_url: ejercicio.imagenes_url || []
            });
          } else {
            console.warn(`⚠️ No hay datos de plantilla para orden ${ejercicio.orden}`);
            nuevosEjercicios.push(ejercicio);
          }
        } else {
          // Ejercicio de otro día, mantener igual
          nuevosEjercicios.push(ejercicio);
        }
      }

      console.log('📝 Nuevos ejercicios creados:', nuevosEjercicios.length);
      console.log(`✏️ Total ejercicios actualizados: ${ejerciciosActualizados}`);

      const ejerciciosDelDiaDespues = nuevosEjercicios.filter(e => e.dia_semana === dia);
      console.log(`Ejercicios del día "${dia}" DESPUÉS:`, ejerciciosDelDiaDespues.length);

      // Verificar que realmente se aplicaron los cambios
      const ejerciciosDelDiaConDatos = nuevosEjercicios.filter(e =>
        e.dia_semana === dia &&
        e.nombre_ejercicio &&
        e.nombre_ejercicio.trim() !== ''
      );

      console.log(`✅ ${ejerciciosDelDiaConDatos.length} ejercicios del día ${dia} tienen datos`);

      if (ejerciciosDelDiaConDatos.length === 0) {
        console.error('❌ ERROR CRÍTICO: No se aplicaron los ejercicios correctamente');
        console.log('Diagnóstico:');
        console.log('- Ejercicios actualizados en loop:', ejerciciosActualizados);
        console.log('- Ejercicios con nombre después:', ejerciciosDelDiaConDatos.length);
        console.log('- Plantilla tenía:', plantilla.length, 'ejercicios');

        alert(
          '❌ Error al aplicar plantilla.\n\n' +
          'Diagnóstico:\n' +
          `- Día: ${dia}\n` +
          `- Plantilla: ${plantillaNombre}\n` +
          `- Ejercicios en plantilla: ${plantilla.length}\n` +
          `- Ejercicios actualizados: ${ejerciciosActualizados}\n` +
          `- Ejercicios con datos: ${ejerciciosDelDiaConDatos.length}\n\n` +
          'Revisa la consola (F12) para más detalles.'
        );
        return;
      }

      console.log('✅ Validación pasada, actualizando estado...');

      // Actualizar el estado de forma segura
      setEjercicios(nuevosEjercicios);

      console.log('Estado actualizado con setEjercicios()');

      // Auto-expandir el día DESPUÉS de actualizar el estado
      setTimeout(() => {
        setExpandedDay(dia);
        console.log('🔽 Día expandido:', dia);
        console.log('=== FIN APLICAR PLANTILLA ===');
      }, 300);

      // Mensaje de confirmación
      setTimeout(() => {
        alert(
          `✅ Plantilla aplicada exitosamente\n\n` +
          `📋 ${plantillaNombre}\n` +
          `📅 ${dia}\n` +
          `🏋️ ${ejerciciosDelDiaConDatos.length} ejercicios configurados\n\n` +
          `El día "${dia}" se expandirá en unos segundos.\n` +
          `Verifica los ejercicios y haz clic en "Guardar Plan".`
        );
      }, 100);

    } catch (error) {
      console.error('💥 ERROR EN aplicarPlantilla:', error);
      console.error('Stack trace:', error.stack);
      alert(`Error inesperado: ${error.message}\n\nRevisa la consola (F12) para más detalles.`);
    }
  };

  const limpiarDia = (dia) => {
    if (window.confirm(`¿Limpiar todos los ejercicios de ${dia}?`)) {
      dias.forEach((_, i) => {
        const orden = i + 1;
        updateEjercicio(dia, orden, 'nombre_ejercicio', '');
        updateEjercicio(dia, orden, 'series', '');
        updateEjercicio(dia, orden, 'repeticiones', '');
        updateEjercicio(dia, orden, 'notas', '');
      });
    }
  };

  const getEjerciciosByDia = (dia) => {
    return ejercicios.filter(e => e.dia_semana === dia).sort((a, b) => a.orden - b.orden);
  };

  const countEjerciciosLlenos = (dia) => {
    return getEjerciciosByDia(dia).filter(e => e.nombre_ejercicio.trim() !== '').length;
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const hayEjercicios = ejercicios.some(e => e.nombre_ejercicio.trim() !== '');

  return (
    <div className="plan-manager">
      <div className="plan-header">
        <div>
          <h2>Plan de Entrenamiento</h2>
          <div className="plan-month-selector">
            <label>Seleccionar mes:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setEditing(false);
              }}
            />
            <span className="plan-month">
              ({new Date(selectedMonth + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' })})
            </span>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-primary">
            <EditIcon />
            <span>{hayEjercicios ? 'Editar Plan' : 'Crear Plan'}</span>
          </button>
        ) : (
          <div className="button-group">
            <button onClick={handleSave} className="btn-success">
              <SaveIcon />
              <span>Guardar Plan</span>
            </button>
            <button onClick={() => { setEditing(false); loadPlan(); }} className="btn-secondary">
              <XIcon />
              <span>Cancelar</span>
            </button>
          </div>
        )}
      </div>

      {!hayEjercicios && !editing && (
        <div className="empty-state">
          <DumbbellIcon />
          <h3>No hay plan de entrenamiento para este mes</h3>
          <p>Haz clic en "Crear Plan" para comenzar</p>
        </div>
      )}

      {editing && (
        <div className="plantillas-section" style={{
          marginBottom: '20px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <div>
              <strong style={{color: '#ff6b35', fontSize: '16px'}}>💡 Ayuda rápida</strong>
              <p style={{margin: '5px 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)'}}>
                Selecciona un día en cada plantilla para llenar automáticamente los 6 ejercicios
              </p>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button
                onClick={() => {
                  console.log('=== DEBUG: ESTADO ACTUAL ===');
                  console.log('Total ejercicios:', ejercicios.length);
                  console.log('Ejercicios completos:', ejercicios.filter(e => e.nombre_ejercicio.trim() !== '').length);
                  dias.forEach(dia => {
                    const ejsDia = ejercicios.filter(e => e.dia_semana === dia && e.nombre_ejercicio.trim() !== '');
                    console.log(`${dia}: ${ejsDia.length}/6`, ejsDia);
                  });
                  alert(`Estado actual:\n\nTotal: ${ejercicios.length} ejercicios\nCompletos: ${ejercicios.filter(e => e.nombre_ejercicio.trim() !== '').length}\n\nRevisa la consola (F12) para más detalles.`);
                }}
                className="btn-secondary"
                style={{fontSize: '13px', padding: '6px 12px'}}
                title="Ver estado actual en consola"
              >
                🐛 Debug
              </button>
              <button
                onClick={() => setShowPlantillas(!showPlantillas)}
                className="btn-secondary"
                style={{fontSize: '14px', whiteSpace: 'nowrap'}}
              >
                {showPlantillas ? '✕ Cerrar Plantillas' : '📋 Ver Plantillas'}
              </button>
            </div>
          </div>

          {showPlantillas && (
            <div style={{
              marginTop: '15px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              {/* ==================== SELECTOR DE CATEGORÍA ==================== */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  👥 Categoría de Entrenamiento:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    padding: '10px 15px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {CATEGORIAS_PLANTILLAS.map(cat => (
                    <option key={cat} value={cat} style={{background: '#1a1a2e', color: '#ffffff'}}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* ==================== PLANTILLAS DE LA CATEGORÍA ==================== */}
              <h4 style={{
                marginBottom: '15px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                📋 Plantillas de {selectedCategory}:
              </h4>

              <div className="plantillas-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '15px'}}>
                {Object.keys(PLANTILLAS_POR_CATEGORIA[selectedCategory] || {}).map(plantillaNombre => {
                  const plantilla = PLANTILLAS_POR_CATEGORIA[selectedCategory][plantillaNombre];
                  return (
                    <div
                      key={plantillaNombre}
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '15px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <strong style={{
                        display: 'block',
                        marginBottom: '10px',
                        color: '#ff6b35',
                        fontSize: '15px'
                      }}>
                        {plantillaNombre}
                      </strong>

                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '10px',
                        lineHeight: '1.4'
                      }}>
                        {plantilla.slice(0, 3).map((ej, i) => (
                          <div key={i}>• {ej.nombre}</div>
                        ))}
                        {plantilla.length > 3 && <div>• +{plantilla.length - 3} más...</div>}
                      </div>

                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            aplicarPlantilla(e.target.value, plantillaNombre);
                            e.target.value = ''; // Resetear select
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                        value=""
                      >
                        <option value="" style={{background: '#1a1a2e', color: '#ffffff'}}>
                          Aplicar a día...
                        </option>
                        {dias.map(dia => (
                          <option
                            key={dia}
                            value={dia}
                            style={{background: '#1a1a2e', color: '#ffffff'}}
                          >
                            {dia}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                💡 <strong>Tip:</strong> El calentamiento debe hacerse SIEMPRE antes de empezar.
                Después aplica la plantilla del día correspondiente y modifica lo necesario antes de guardar.
              </div>
            </div>
          )}
        </div>
      )}

      <div className="days-list">
        {editing && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="plan-progress-bar">
              <div>
                <strong style={{color: '#ffffff', fontSize: '14px'}}>📊 Progreso del Plan:</strong>
                <div className="plan-progress-days" style={{marginTop: '8px', display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                  {dias.map(dia => {
                    const count = countEjerciciosLlenos(dia);
                    return (
                      <span
                        key={dia}
                        style={{
                          fontSize: '13px',
                          color: count > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                          fontWeight: count > 0 ? '600' : '400'
                        }}
                      >
                        {dia}: {count}/6
                      </span>
                    );
                  })}
                </div>
              </div>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: '#ff6b35'}}>
                {ejercicios.filter(e => e.nombre_ejercicio.trim() !== '').length}/36
              </div>
            </div>
          </div>
        )}

        {dias.map(dia => {
          const ejerciciosCount = countEjerciciosLlenos(dia);
          return (
            <div key={dia} className="day-card">
              <button
                className="day-header"
                onClick={() => setExpandedDay(expandedDay === dia ? null : dia)}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span className="day-name">{dia}</span>
                  {ejerciciosCount > 0 && (
                    <span style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {ejerciciosCount} ejercicio{ejerciciosCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {expandedDay === dia ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </button>

              {expandedDay === dia && (
                <div className="day-exercises">
                  {editing && (
                    <div style={{marginBottom: '15px', display: 'flex', gap: '10px'}}>
                      <button
                        onClick={() => limpiarDia(dia)}
                        className="btn-secondary"
                        style={{fontSize: '13px'}}
                      >
                        🗑️ Limpiar día
                      </button>
                    </div>
                  )}

                  {getEjerciciosByDia(dia).map(ejercicio => (
                    <div key={`${dia}-${ejercicio.orden}`} className="exercise-card">
                      <div className="exercise-grid">
                        <div className="exercise-field">
                          <label>Ejercicio {ejercicio.orden}</label>
                          {editing ? (
                            <div style={{position: 'relative'}} className="ejercicio-dropdown-container">
                              <input
                                type="text"
                                value={ejercicio.nombre_ejercicio}
                                onChange={(e) => updateEjercicio(dia, ejercicio.orden, 'nombre_ejercicio', e.target.value)}
                                placeholder="Escribe o haz clic para ver lista..."
                                onClick={() => setShowEjerciciosList(`${dia}-${ejercicio.orden}`)}
                                onFocus={() => setShowEjerciciosList(`${dia}-${ejercicio.orden}`)}
                                style={{width: '100%', cursor: 'text'}}
                                autoComplete="off"
                              />
                              {showEjerciciosList === `${dia}-${ejercicio.orden}` && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  background: 'white',
                                  border: '1px solid #ddd',
                                  borderRadius: '6px',
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                  zIndex: 1000,
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                  marginTop: '4px'
                                }}>
                                  <div style={{padding: '8px', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', position: 'sticky', top: 0}}>
                                    <strong style={{fontSize: '13px', color: '#333'}}>Selecciona un ejercicio:</strong>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEjerciciosList(null);
                                      }}
                                      style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666'}}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  {Object.entries(EJERCICIOS_COMUNES).map(([categoria, ejercs]) => (
                                    <div key={categoria}>
                                      <div style={{padding: '8px 12px', background: '#f0f0f0', fontWeight: 'bold', fontSize: '13px', color: '#444', position: 'sticky', top: '41px'}}>
                                        {categoria}
                                      </div>
                                      {ejercs.map(ej => (
                                        <div
                                          key={ej}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            seleccionarEjercicio(dia, ejercicio.orden, ej);
                                          }}
                                          style={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f0f0f0',
                                            fontSize: '14px',
                                            color: '#333',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.background = '#f8f9fa';
                                            e.target.style.paddingLeft = '16px';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.background = 'white';
                                            e.target.style.paddingLeft = '12px';
                                          }}
                                        >
                                          {ej}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={ejercicio.nombre_ejercicio}
                              disabled
                              placeholder="Sin ejercicio"
                            />
                          )}
                        </div>
                        <div className="exercise-field">
                          <label>Series</label>
                          <input
                            type="text"
                            value={ejercicio.series}
                            onChange={(e) => updateEjercicio(dia, ejercicio.orden, 'series', e.target.value)}
                            disabled={!editing}
                            placeholder="ej: 4"
                          />
                        </div>
                        <div className="exercise-field">
                          <label>Repeticiones</label>
                          <input
                            type="text"
                            value={ejercicio.repeticiones}
                            onChange={(e) => updateEjercicio(dia, ejercicio.orden, 'repeticiones', e.target.value)}
                            disabled={!editing}
                            placeholder="ej: 10-12"
                          />
                        </div>
                        <div className="exercise-field exercise-field-full">
                          <label>Notas / Instrucciones</label>
                          <input
                            type="text"
                            value={ejercicio.notas}
                            onChange={(e) => updateEjercicio(dia, ejercicio.orden, 'notas', e.target.value)}
                            disabled={!editing}
                            placeholder="Instrucciones específicas, técnica, etc..."
                          />
                        </div>

                        <div className="exercise-field exercise-field-full">
                          <label>Imágenes de referencia ({(ejercicio.imagenes_url || []).length}/3)</label>
                          <div className="exercise-images-gallery">
                            {(ejercicio.imagenes_url || []).map((url, imgIndex) => (
                              <div key={imgIndex} className="exercise-image-preview">
                                <img
                                  src={url}
                                  alt={`${ejercicio.nombre_ejercicio || 'Ejercicio'} ${imgIndex + 1}`}
                                  className="exercise-image-thumb"
                                  loading="lazy"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                {editing && (
                                  <button
                                    type="button"
                                    className="btn-remove-image"
                                    onClick={() => handleImageRemove(dia, ejercicio.orden, url, imgIndex)}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            ))}
                            {editing && (ejercicio.imagenes_url || []).length < 3 && (
                              <div className="exercise-image-upload">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/gif"
                                  id={`img-${dia}-${ejercicio.orden}`}
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleImageUpload(dia, ejercicio.orden, e.target.files[0]);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`img-${dia}-${ejercicio.orden}`}
                                  className="btn-upload-image"
                                >
                                  + Subir imagen (JPG/GIF, max 5MB)
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrainingPlanManager;
