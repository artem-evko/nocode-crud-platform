import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function ${entity.name()}Form() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Form State
  <#list entity.fields() as field>
  <#if field.name()?lower_case != "id">
  <#if field.type() == "STRING">
  const [${field.name()}, set${field.name()?cap_first}] = useState('');
  <#elseif field.type() == "INTEGER" || field.type() == "DECIMAL">
  const [${field.name()}, set${field.name()?cap_first}] = useState<number | ''>('');
  <#elseif field.type() == "BOOLEAN">
  const [${field.name()}, set${field.name()?cap_first}] = useState(false);
  <#elseif field.type() == "DATE">
  const [${field.name()}, set${field.name()?cap_first}] = useState('');
  </#if>
  </#if>
  </#list>

  useEffect(() => {
    if (isEditing) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      <#assign hasFieldsToSet = false>
      <#list entity.fields() as field>
      <#if field.name()?lower_case != "id">
        <#assign hasFieldsToSet = true>
      </#if>
      </#list>
      <#if hasFieldsToSet>
      const response = await api.get(`/${entity.table()}/r${r"${id}"}`);
      const data = response.data;
      <#list entity.fields() as field>
      <#if field.name()?lower_case != "id">
      set${field.name()?cap_first}(data.${field.name()});
      </#if>
      </#list>
      <#else>
      await api.get(`/${entity.table()}/r${r"${id}"}`);
      // No non-id fields to map from response
      </#if>
    } catch (error) {
      console.error('Failed to fetch ${entity.name()}', error);
      alert('Record not found');
      navigate('/${entity.name()?lower_case}');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      <#list entity.fields() as field>
      <#if field.name()?lower_case != "id">
      ${field.name()},
      </#if>
      </#list>
    };

    try {
      if (isEditing) {
        await api.put(`/${entity.table()}/r${r"${id}"}`, payload);
      } else {
        await api.post('/${entity.table()}', payload);
      }
      navigate('/${entity.name()?lower_case}');
    } catch (error) {
      console.error('Failed to save ${entity.name()}', error);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/${entity.name()?lower_case}" 
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit ${entity.name()}' : 'Create ${entity.name()}'}
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <#list entity.fields() as field>
          <#if field.name()?lower_case != "id">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 capitalize">
              ${field.name()} <#if field.required()><span className="text-red-500">*</span></#if>
            </label>
            <#if field.type() == "STRING">
            <input
              type="text"
              value={${field.name()}}
              onChange={(e) => set${field.name()?cap_first}(e.target.value)}
              <#if field.required()>required</#if>
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <#elseif field.type() == "INTEGER" || field.type() == "DECIMAL">
            <input
              type="number"
              value={${field.name()}}
              onChange={(e) => set${field.name()?cap_first}(Number(e.target.value))}
              <#if field.required()>required</#if>
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <#elseif field.type() == "BOOLEAN">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={${field.name()}}
                onChange={(e) => set${field.name()?cap_first}(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">Enable ${field.name()}</span>
            </label>
            <#elseif field.type() == "DATE">
            <input
              type="date"
              value={${field.name()}}
              onChange={(e) => set${field.name()?cap_first}(e.target.value)}
              <#if field.required()>required</#if>
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            </#if>
          </div>
          </#if>
          </#list>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <Link 
              to="/${entity.name()?lower_case}" 
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
