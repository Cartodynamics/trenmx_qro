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
    LocalidadesSedeINPI: false,
    PresidenciasMunicipales: false,
    or_zona1: false,
    or_zona2: false,
    polos: true
    
  });

  const handleToggle = (id: string) => {
    setLayersVisibility(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections: InfoBoxSection[] = [
    
    {
      title: 'Polos de Desarrollo para el Bienestar',
      items: [
        { id: 'polos', label: 'Polos', color: '#C83182', shape: 'circle', checked: layersVisibility['polos'] },
      ],
    },
    {
      title: 'Comunidades Indígenas y Afromexicanas',
      items: [
        { id: 'LocalidadesSedeINPI', label: 'Pueblos Indígenas', color: '#666666', shape: 'circle', switch: true, checked: layersVisibility['LocalidadesSedeINPI'] },
      ],
    },
    {
      title: 'Zona 1 - Norte',
      items: [
        { id: 'or_zona1', label: 'Oficinas de Representación INPI', color: '#BC955C', shape: 'circle', switch: true, checked: layersVisibility['or_zona1'] },
        { id: 'mesas_cercanas_zona1', label: 'Mesas de Paz', color: '#f8e71c', shape: 'square', switch: true, checked: layersVisibility['mesas_cercanas_zona1'] },
        { id: 'regiones_zona1', label: 'Regiones de Paz', color: '#66c2a5', shape: 'square', switch: true, checked: layersVisibility['regiones_zona1'] },
      ],
    },
    {
      title: 'Zona 2 - Sur',
      items: [
        { id: 'or_zona2', label: 'Oficinas de Representación INPI', color: '#BC955C', shape: 'circle', switch: true, checked: layersVisibility['or_zona2'] },
        { id: 'mesas_cercanas_zona2', label: 'Mesas de Paz', color: '#f8e71c', shape: 'square', switch: true, checked: layersVisibility['mesas_cercanas_zona2'] },
        { id: 'regiones_zona2', label: 'Regiones de Paz', color: '#fc8d62', shape: 'square', switch: true, checked: layersVisibility['regiones_zona2'] }
      ],
    },
    
    {
      title: 'Presidencias Municipales',
      items: [
        { id: 'PresidenciasMunicipales', label: 'Cabeceras Municipales', color: '#000000', shape: 'circle', switch: true, checked: layersVisibility['PresidenciasMunicipales'] },
      ],
    },
       
  ];

  return (
    <>
      <InfoBox
        title=" Polos de Desarrollo para el Bienestar publicados en el DOF"
        sections={sections}
        onToggle={handleToggle}
      />

      <Map layersVisibility={layersVisibility} isocronaMin={0} />
    </>
  );
};

export default App;

