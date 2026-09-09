import React, { useRef } from 'react';
import { MollierDiagram } from './components/Diagram/MollierDiagram';
import { Refrigeration3DView } from './components/Refrigeration3D/Refrigeration3DView';
import { SchematicCanvas } from './components/Schematic/SchematicCanvas';
import { Header } from './components/Header/Header';
import { AvailabilityMatrixModal } from './components/Modals/AvailabilityMatrixModal';
import { SampleCyclesModal } from './components/Modals/SampleCyclesModal';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ProjectProvider, useProject } from './context/ProjectContext';

const MainAppContent: React.FC = () => {
  const {
    toastMessage,
    projectName,
    selectedFluidId,
    themeMode,
    mainViewMode,
  } = useProject();

  const canvasExportRef = useRef<(() => Promise<string | null>) | null>(null);

  const handleExportPng = async () => {
    if (canvasExportRef.current) {
      const dataUrl = await canvasExportRef.current();
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${selectedFluidId}_mollier.png`;
        a.click();
      }
    }
  };

  return (
    <div className={`flex flex-col w-screen h-screen overflow-hidden ${themeMode === 'dark' ? 'dark' : ''} bg-[#f4f5f8] dark:bg-[#0f1115] text-slate-800 dark:text-slate-100 antialiased selection:bg-sky-600 selection:text-white font-sans transition-colors duration-200`}>
      {/* Top Header */}
      <Header onExportPng={handleExportPng} />

      {/* Main Workspace */}
      <div className="flex flex-1 h-[calc(100vh-52px)] overflow-hidden relative">
        {/* Left Sidebar (Layers, Points, Connections) - show in diagram and split mode */}
        {(mainViewMode === 'diagram' || mainViewMode === 'split') && (
          <Sidebar />
        )}

        {/* Central Workspace Area */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-200/70 dark:bg-[#12141a]">
          {mainViewMode === 'diagram' && (
            <MollierDiagram canvasExportRef={canvasExportRef} />
          )}

          {mainViewMode === 'schematic' && (
            <SchematicCanvas />
          )}

          {mainViewMode === '3d' && (
            <Refrigeration3DView />
          )}

          {mainViewMode === 'split' && (
            <div className="flex w-full h-full">
              {/* Left half: Mollier log(P)-h Diagram */}
              <div className="flex-1 h-full relative border-r border-slate-300 dark:border-slate-800">
                <MollierDiagram canvasExportRef={canvasExportRef} />
              </div>

              {/* Right half: Schematic P&ID Circuit */}
              <div className="flex-1 h-full relative">
                <SchematicCanvas />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SampleCyclesModal />
      <AvailabilityMatrixModal />

      {/* Technical Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 flex items-center gap-2.5 px-3.5 py-2.5 bg-white dark:bg-[#1a1d24] border border-slate-300 dark:border-slate-700/80 shadow-lg rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainAppContent />
    </ProjectProvider>
  );
}
