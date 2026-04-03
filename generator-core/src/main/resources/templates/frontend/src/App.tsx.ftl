import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
<#assign usesNavigate = authEnabled || !(uiSpec?? && uiSpec.components()?? && uiSpec.components()?size &gt; 0)>
<#if usesNavigate>
import { Navigate } from 'react-router-dom';
</#if>
<#if authEnabled>import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
</#if>
<#if uiSpec?? && uiSpec.components()?? && uiSpec.components()?size &gt; 0>
import Dashboard from './pages/Dashboard';
</#if>
<#if entities??>
<#list entities as entity>
import ${entity.name()}List from './pages/${entity.name()}List';
import ${entity.name()}Form from './pages/${entity.name()}Form';
</#list>
</#if>

function App() {
<#if authEnabled>
  const { token, logout } = useAuthStore();
</#if>

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex">
        
<#if authEnabled>
        {token && (
</#if>
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 font-bold text-lg">
            ${appName} Admin
          </div>
          <nav className="flex-1 p-4 space-y-1">
          <#if uiSpec?? && uiSpec.components()?? && uiSpec.components()?size &gt; 0>
            <Link to="/" className="block px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              Dashboard
            </Link>
          </#if>
          <#if entities??>
          <#list entities as entity>
            <Link to="/${entity.name()?lower_case}" className="block px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              ${entity.name()} Data
            </Link>
          </#list>
          </#if>
          </nav>
<#if authEnabled>
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button onClick={logout} className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left">
              Log out
            </button>
          </div>
</#if>
        </aside>
<#if authEnabled>
        )}
</#if>

        <main className="flex-1 overflow-auto">
          <Routes>
          <#if authEnabled>
            <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/" replace />} />
          </#if>
            
          <#if entities??>
          <#list entities as entity>
            <Route path="/${entity.name()?lower_case}" element={<#if authEnabled>token ? <${entity.name()}List /> : <Navigate to="/login" replace /><#else><${entity.name()}List /></#if>} />
            <Route path="/${entity.name()?lower_case}/new" element={<#if authEnabled>token ? <${entity.name()}Form /> : <Navigate to="/login" replace /><#else><${entity.name()}Form /></#if>} />
            <Route path="/${entity.name()?lower_case}/:id" element={<#if authEnabled>token ? <${entity.name()}Form /> : <Navigate to="/login" replace /><#else><${entity.name()}Form /></#if>} />
          </#list>
          </#if>
            
          <#if uiSpec?? && uiSpec.components()?? && uiSpec.components()?size &gt; 0>
            <Route path="/" element={<#if authEnabled>token ? <Dashboard /> : <Navigate to="/login" replace /><#else><Dashboard /></#if>} />
          <#else>
            <Route path="/" element={<Navigate to="<#if entities?? && entities?size &gt; 0>/${entities[0].name()?lower_case}<#else>/</#if>" replace />} />
          </#if>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
