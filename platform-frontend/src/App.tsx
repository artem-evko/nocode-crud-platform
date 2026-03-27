import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import ModelerPage from './pages/ModelerPage';
import UIBuilderPage from './pages/UIBuilderPage';
import ActionFlowPage from './pages/ActionFlowPage';
import PreviewPage from './pages/PreviewPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" theme="dark" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/modeler" element={<ModelerPage />} />
        <Route path="/projects/:projectId/builder" element={<UIBuilderPage />} />
        <Route path="/projects/:projectId/flows" element={<ActionFlowPage />} />
        <Route path="/projects/:projectId/preview" element={<PreviewPage />} />
        <Route path="/" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
