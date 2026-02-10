import React, { useState, useEffect } from 'react';
import { nutricionService } from '../../services/api';
import { EditIcon, SaveIcon, XIcon } from '../common/Icons';
import { TIPOS_COMIDA } from '../../constants/plantillas';

function NutritionPlanManager({ participantId, userId }) {
  const [plan, setPlan] = useState(null);
  const [comidas, setComidas] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, [participantId]);

  const loadPlan = async () => {
    try {
      const data = await nutricionService.obtenerPlan(participantId);
      setPlan(data.plan);

      if (data.comidas && data.comidas.length > 0) {
        setComidas(data.comidas);
        setRecomendaciones(data.plan?.recomendaciones_generales || '');
      } else {
        // Crear estructura vacía
        const emptyComidas = TIPOS_COMIDA.map(tipo => ({
          tipo_comida: tipo,
          opcion_1: '',
          opcion_2: ''
        }));
        setComidas(emptyComidas);
      }
    } catch (error) {
      console.error('Error cargando plan de nutrición:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await nutricionService.guardarPlan({
        participante_id: participantId,
        recomendaciones_generales: recomendaciones,
        comidas: comidas
      });
      setEditing(false);
      loadPlan();
      alert('Plan de nutrición guardado exitosamente');
    } catch (error) {
      alert('Error al guardar el plan');
    }
  };

  const updateComida = (tipo, field, value) => {
    setComidas(prev => prev.map(c =>
      c.tipo_comida === tipo
        ? { ...c, [field]: value }
        : c
    ));
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="plan-manager">
      <div className="plan-header">
        <h2>Plan de Nutrición</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-primary btn-green">
            <EditIcon />
            <span>Editar Plan</span>
          </button>
        ) : (
          <div className="button-group">
            <button onClick={handleSave} className="btn-success">
              <SaveIcon />
              <span>Guardar</span>
            </button>
            <button onClick={() => { setEditing(false); loadPlan(); }} className="btn-secondary">
              <XIcon />
              <span>Cancelar</span>
            </button>
          </div>
        )}
      </div>

      <div className="nutrition-list">
        {comidas.map(comida => (
          <div key={comida.tipo_comida} className="meal-card">
            <h3 className="meal-title">{comida.tipo_comida}</h3>
            <div className="meal-options">
              <div className="meal-option">
                <label>Opción 1</label>
                <textarea
                  value={comida.opcion_1}
                  onChange={(e) => updateComida(comida.tipo_comida, 'opcion_1', e.target.value)}
                  disabled={!editing}
                  placeholder="Describe la primera opción..."
                  rows={3}
                />
              </div>
              <div className="meal-option">
                <label>Opción 2</label>
                <textarea
                  value={comida.opcion_2}
                  onChange={(e) => updateComida(comida.tipo_comida, 'opcion_2', e.target.value)}
                  disabled={!editing}
                  placeholder="Describe la segunda opción..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="recommendations-card">
          <h3 className="meal-title">Recomendaciones Adicionales</h3>
          <textarea
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
            disabled={!editing}
            placeholder="Hidratación, suplementos, horarios..."
            rows={5}
          />
        </div>
      </div>
    </div>
  );
}

export default NutritionPlanManager;
