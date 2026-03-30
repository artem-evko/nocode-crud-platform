import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';

function App() {

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex">
        
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 font-bold text-lg">
            Auto Deploy End-to-End Test Admin
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <Link to="/task" className="block px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              Task Data
            </Link>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <Routes>
            
            <Route path="/task" element={<TaskList />} />
            <Route path="/task/new" element={<TaskForm />} />
            <Route path="/task/:id" element={<TaskForm />} />
            
            <Route path="/" element={<Navigate to="/task" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
