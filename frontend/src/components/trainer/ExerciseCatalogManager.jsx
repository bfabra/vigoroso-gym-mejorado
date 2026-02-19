import React, { useState, useEffect } from 'react';
import { catalogoService } from '../../services/api';

const GRUPOS_MUSCULARES = ['Pecho', 'Espalda', 'Hombros', 'Piernas', 'Gluteo', 'Brazos', 'Core', 'Cardio', 'Movilidad'];

function ExerciseCatalogManager() {
  const [ejercicios, setEjercicios] = useState([]);
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', grupo_muscular: 'Pecho', instrucciones: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEjercicios();
  }, [filtroGrupo, busqueda]);

  const loadEjercicios = async () => {
    try {
      const params = {};
      if (filtroGrupo) params.grupo_muscular = filtroGrupo;
      if (busqueda) params.search = busqueda;
      const data = await catalogoService.listar(params);
      setEjercicios(data);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await catalogoService.actualizar(editingId, form);
      } else {
        await catalogoService.crear(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ nombre: '', grupo_muscular: 'Pecho', instrucciones: '' });
      loadEjercicios();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar ejercicio');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ej) => {
    setForm({ nombre: ej.nombre, grupo_muscular: ej.grupo_muscular, instrucciones: ej.instrucciones || '' });
    setEditingId(ej.id);
    setShowForm(true);
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Desactivar "${nombre}" del catálogo?`)) {
      try {
        await catalogoService.eliminar(id);
        loadEjercicios();
      } catch (error) {
        alert(error.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  const handleImageUpload = async (ejercicioId, file) => {
    try {
      await catalogoService.subirImagen(ejercicioId, file);
      loadEjercicios();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al subir imagen');
    }
  };

  const handleImageDelete = async (ejercicioId, slot) => {
    try {
      await catalogoService.eliminarImagen(ejercicioId, slot);
      loadEjercicios();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al eliminar imagen');
    }
  };

  // Agrupar por grupo muscular
  const grupos = {};
  ejercicios.forEach(ej => {
    if (!grupos[ej.grupo_muscular]) grupos[ej.grupo_muscular] = [];
    grupos[ej.grupo_muscular].push(ej);
  });

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ color: '#ffffff', margin: 0 }}>Catálogo de Ejercicios</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ nombre: '', grupo_muscular: 'Pecho', instrucciones: '' }); }} className="btn-primary">
          + Nuevo Ejercicio
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '1rem' }}
        />
        <select
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
          style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '1rem' }}
        >
          <option value="">Todos los grupos</option>
          {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--dark-border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '0.75rem' }}>
            {editingId ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="catalog-form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Grupo Muscular *</label>
                <select value={form.grupo_muscular} onChange={(e) => setForm({...form, grupo_muscular: e.target.value})} required>
                  {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Instrucciones</label>
              <textarea value={form.instrucciones} onChange={(e) => setForm({...form, instrucciones: e.target.value})} rows="2" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button type="submit" className="btn-success" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista agrupada */}
      <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        {ejercicios.length} ejercicios en el catálogo
      </div>

      {Object.entries(grupos).map(([grupo, ejs]) => (
        <div key={grupo} style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--orange-primary)', fontSize: '0.95rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dark-border)', paddingBottom: '0.25rem' }}>
            {grupo} ({ejs.length})
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {ejs.map(ej => (
              <div key={ej.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--dark-border)', borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#ffffff' }}>{ej.nombre}</strong>
                  {ej.instrucciones && (
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{ej.instrucciones}</p>
                  )}
                  {/* Imágenes */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3].map(slot => {
                      const url = ej[`imagen_${slot}_url`];
                      return url ? (
                        <div key={slot} style={{ position: 'relative', width: '60px', height: '60px' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                          <button onClick={() => handleImageDelete(ej.id, slot)} style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', lineHeight: '1' }}>x</button>
                        </div>
                      ) : null;
                    })}
                    {(!ej.imagen_1_url || !ej.imagen_2_url || !ej.imagen_3_url) && (
                      <label style={{ width: '60px', height: '60px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '20px' }}>
                        +
                        <input type="file" accept="image/jpeg,image/gif" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleImageUpload(ej.id, e.target.files[0]); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => handleEdit(ej)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Editar</button>
                  <button onClick={() => handleDelete(ej.id, ej.nombre)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {ejercicios.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
          No se encontraron ejercicios
        </div>
      )}
    </div>
  );
}

export default ExerciseCatalogManager;
