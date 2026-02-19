import React, { useState } from 'react';
import { UserIcon, DumbbellIcon, AppleIcon } from '../common/Icons';
import TrainingPlanManager from '../training/TrainingPlanManager';
import TemplateAssigner from '../training/TemplateAssigner';
import PlanV2Manager from '../training/PlanV2Manager';
import NutritionPlanManager from '../nutrition/NutritionPlanManager';

function ManageParticipant({ participant, onBack, user }) {
  const [activeTab, setActiveTab] = useState('training');

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={onBack} className="btn-back">← Volver</button>
            <div className="participant-avatar-small">
              <UserIcon />
            </div>
            <div>
              <h1 className="header-title">{participant.nombre}</h1>
              <p className="header-subtitle">Gestión de Planes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'training' ? 'active' : ''}`}
            onClick={() => setActiveTab('training')}
          >
            <DumbbellIcon />
            <span>Plan de Entrenamiento</span>
          </button>
          <button
            className={`tab ${activeTab === 'assign' ? 'active' : ''}`}
            onClick={() => setActiveTab('assign')}
          >
            <DumbbellIcon />
            <span>Asignar Plantilla</span>
          </button>
          <button
            className={`tab ${activeTab === 'plansv2' ? 'active' : ''}`}
            onClick={() => setActiveTab('plansv2')}
          >
            <DumbbellIcon />
            <span>Programas v2</span>
          </button>
          <button
            className={`tab ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <AppleIcon />
            <span>Plan de Nutrición</span>
          </button>
        </div>

        {activeTab === 'training' && (
          <TrainingPlanManager participantId={participant.id} userId={user.id} />
        )}
        {activeTab === 'assign' && (
          <TemplateAssigner participantId={participant.id} userId={user.id} />
        )}
        {activeTab === 'plansv2' && (
          <PlanV2Manager participantId={participant.id} userId={user.id} />
        )}
        {activeTab === 'nutrition' && (
          <NutritionPlanManager participantId={participant.id} userId={user.id} />
        )}
      </main>
    </div>
  );
}

export default ManageParticipant;
