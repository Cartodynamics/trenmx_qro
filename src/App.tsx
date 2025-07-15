import React, { useState } from 'react';
import InfoBox, { InfoBoxSection } from './components/InfoBox/InfoBox';
import Map from './components/Map/Map';
import './App.css';

const App: React.FC = () => {
  const [layersVisibility, setLayersVisibility] = useState<Record<string, boolean>>({
    mesas_cercanas_zona1: false,
    mesas_cercanas_zona2: false,
    regiones_zona1: false,
    regiones_zona2: false,
    LocalidadesSedeINPI: true,
    PuntosWiFiCFE_4G: false,
    PuntosWiFiCFE_FIBRA: false,
    PuntosWiFiCFE_SATELITAL: false,
    PresidenciasMunicipales: false,
    nucleos_agrarios: false,
    or_zona1: false,
    or_zona2: false,    
  });

  const handleToggle = (id: string) => {
    setLayersVisibility(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections: InfoBoxSection[] = [
    
      {
      title: 'Comunidades Indígenas y Afromexicanas',
      items: [
        { id: 'LocalidadesSedeINPI', label: 'Pueblos Indígenas', color: '#666666', shape: 'circle', switch: true, checked: layersVisibility['LocalidadesSedeINPI'] },
      ],
      },

      {
      title: 'Mesas de Paz - Zona 1: Norte',
      items: [
        { id: 'or_zona1', label: 'Oficinas de Representación INPI', color: '#BC955C', shape: 'circle', switch: true, checked: layersVisibility['or_zona1'] },
        { id: 'regiones_zona1', label: 'Regiones de Paz', color: '#66c2a5', shape: 'square', switch: true, checked: layersVisibility['regiones_zona1'] },
      ],
    },
    {
      title: 'Mesas de Paz - Zona 2: Sur',
      items: [
        { id: 'or_zona2', label: 'Oficinas de Representación INPI', color: '#BC955C', shape: 'circle', switch: true, checked: layersVisibility['or_zona2'] },
        { id: 'regiones_zona2', label: 'Regiones de Paz', color: '#fc8d62', shape: 'square', switch: true, checked: layersVisibility['regiones_zona2'] }
      ],
    },
    {
  title: 'Núcleos Agrarios',
  items: [
    { id: 'nucleos_agrarios', label: 'Núcleos Agrarios', color: '#4b352a', shape: 'square', switch: true, checked: layersVisibility['nucleos_agrarios'] },
  ],
},   
    {
      title: 'Presidencias Municipales',
      items: [
        { id: 'PresidenciasMunicipales', label: 'Cabeceras Municipales', color: '#000000', shape: 'circle', switch: true, checked: layersVisibility['PresidenciasMunicipales'] },
      ],
    },
       {
      title: 'Despliegue WiFi CFE',
      items: [
        { id: 'PuntosWiFiCFE_4G', label: '4G', color: '#9f2241', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_4G'] },
        { id: 'PuntosWiFiCFE_FIBRA', label: 'Fibra o Cobre', color: '#cda578', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_FIBRA'] },
        { id: 'PuntosWiFiCFE_SATELITAL', label: 'Satelital', color: '#235b4e', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_SATELITAL'] },
      ],
    },
  ];

  return (
    <>
      <InfoBox
        title="Mapa de la Dirección General de Participación y Consultas"
        sections={sections}
        onToggle={handleToggle}
      />

      <Map layersVisibility={layersVisibility} isocronaMin={0} />
    </>
  );
};

export default App;

