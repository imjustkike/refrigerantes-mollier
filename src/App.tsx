import React, { useRef } from 'react';
import { MollierDiagram } from './components/Diagram/MollierDiagram';
import { Header } from './components/Header/Header';
import { AvailabilityMatrixModal } from './components/Modals/AvailabilityMatrixModal';
import { SampleCyclesModal } from './components/Modals/SampleCyclesModal';
import { PointsTable } from './components/PointsTable/PointsTable';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ProjectProvider, useProject } from './context/ProjectContext';

const MainAppContent: React.FC = () => {
  const {
    toastMessage,
    projectName,
    selectedFluidId,
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
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white font-sans">
      {/* Top Header */}
      <Header onExportPng={handleExportPng} />

      {/* Main Workspace */}
      <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden relative">
        {/* Left Sidebar (Layers, Points, Connections, Editor) */}
        <Sidebar />

        {/* Center Diagram (Expanded to full width) */}
        <div className="flex-1 h-full relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <MollierDiagram canvasExportRef={canvasExportRef} />
        </div>

        {/* Collapsible Bottom Points Table */}
        <PointsTable />
      </div>

      {/* Modals */}
      <SampleCyclesModal />
      <AvailabilityMatrixModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border border-cyan-500/50 shadow-2xl shadow-cyan-500/20 rounded-xl text-xs font-medium text-slate-100 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
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
