import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DepartmentList from './pages/DepartmentList';
import DepartmentForm from './pages/DepartmentForm';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';

function App() {
  const { token, logout } = useAuthStore();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex">
        
        {token && (
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 font-bold text-lg">
            TestApp Admin
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <Link to="/department" className="block px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              Department Data
            </Link>
            <Link to="/employee" className="block px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              Employee Data
            </Link>
          </nav>
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button onClick={logout} className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left">
              Log out
            </button>
          </div>
        </aside>
        )}

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/" replace />} />
            
            <Route path="/department" element={token ? <DepartmentList /> : <Navigate to="/login" replace />} />
            <Route path="/department/new" element={token ? <DepartmentForm /> : <Navigate to="/login" replace />} />
            <Route path="/department/:id" element={token ? <DepartmentForm /> : <Navigate to="/login" replace />} />
            <Route path="/employee" element={token ? <EmployeeList /> : <Navigate to="/login" replace />} />
            <Route path="/employee/new" element={token ? <EmployeeForm /> : <Navigate to="/login" replace />} />
            <Route path="/employee/:id" element={token ? <EmployeeForm /> : <Navigate to="/login" replace />} />
            
            <Route path="/" element={<Navigate to="/department" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
