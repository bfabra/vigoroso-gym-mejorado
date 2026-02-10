import React, { useState } from 'react';
import { UserIcon, DumbbellIcon, AppleIcon } from '../common/Icons';
import TrainingPlanManager from '../training/TrainingPlanManager';
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
        {activeTab === 'nutrition' && (
          <NutritionPlanManager participantId={participant.id} userId={user.id} />
        )}
      </main>
    </div>
  );
}

export default ManageParticipant;
