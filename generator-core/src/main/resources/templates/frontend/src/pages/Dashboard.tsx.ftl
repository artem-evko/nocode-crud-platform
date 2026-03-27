<#if entities??>
<#list entities as entity>
import ${entity.name()}List from './${entity.name()}List';
import ${entity.name()}Form from './${entity.name()}Form';
// @ts-ignore - may be unused depending on uiSpec
const _${entity.name()}ListRef = ${entity.name()}List;
// @ts-ignore - may be unused depending on uiSpec
const _${entity.name()}FormRef = ${entity.name()}Form;
</#list>
</#if>
</#if>
import { apiClient } from '../lib/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 750 },
];

export default function Dashboard() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
<#macro renderComponent component>
<#if component.type() == "Heading">
            <h2 className="text-3xl font-bold tracking-tight text-white dark:text-zinc-50 mb-2">${component.props()['text']!'Heading'}</h2>
<#elseif component.type() == "Text">
            <p className="text-zinc-500 max-w-2xl">${component.props()['text']!'Text block'}</p>
<#elseif component.type() == "Button">
            <button 
                <#if component.props()['actionFlowId']??>
                onClick={() => {
                    apiClient.post('/actions/${component.props()['actionFlowId']}', {})
                        .then(res => {
                            if (res.data.toast) {
                                alert(res.data.toast);
                            } else {
                                alert("Экшен успешно выполнен");
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            alert("Ошибка выполнения экшена");
                        });
                }}
                </#if>
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors shadow-sm text-white"
            >
                ${component.props()['text']!'Button'}
            </button>
<#elseif component.type() == "DataTable">
    <#if component.props()['entityName']??>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 mb-6 shadow-xl">
                 <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                     <h3 className="font-semibold text-white tracking-wide">${component.props()['entityName']} Table</h3>
                 </div>
                 <div className="p-0">
                     <${component.props()['entityName']}List />
                 </div>
            </div>
    <#else>
            <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 rounded my-4">
                DataTable component missing 'entityName' binding.
            </div>
    </#if>
<#elseif component.type() == "FormModule">
    <#if component.props()['entityName']??>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 mb-6 max-w-2xl shadow-xl">
                 <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                     <h3 className="font-semibold text-white tracking-wide">${component.props()['entityName']} Form</h3>
                 </div>
                 <div className="p-6">
                     <${component.props()['entityName']}Form />
                 </div>
            </div>
    <#else>
            <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 rounded my-4">
                FormModule component missing 'entityName' binding.
            </div>
    </#if>
<#elseif component.type() == "BarChart">
    <#if component.props()['entityName']??>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 mb-6 shadow-md p-6">
                <h3 className="font-semibold text-white tracking-wide mb-4">${component.props()['entityName']} Activity (Mock Data)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                            <XAxis dataKey="name" stroke="#a1a1aa" />
                            <YAxis stroke="#a1a1aa" />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
    <#else>
            <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 rounded my-4">
                BarChart component missing 'entityName' binding.
            </div>
    </#if>
<#elseif component.type() == "LineChart">
    <#if component.props()['entityName']??>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 mb-6 shadow-md p-6">
                <h3 className="font-semibold text-white tracking-wide mb-4">${component.props()['entityName']} Trend (Mock Data)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                            <XAxis dataKey="name" stroke="#a1a1aa" />
                            <YAxis stroke="#a1a1aa" />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
    <#else>
            <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 rounded my-4">
                LineChart component missing 'entityName' binding.
            </div>
    </#if>
<#elseif component.type() == "Container">
            <div className="flex flex-col gap-4 p-6 border border-zinc-800 rounded-xl bg-zinc-900/30 w-full mb-4">
    <#if component.children()?? && component.children()?size \gt 0>
        <#list component.children() as child>
                <@renderComponent component=child />
        </#list>
    <#else>
                <div className="text-zinc-500 text-sm text-center py-4 border-2 border-dashed border-zinc-800 rounded-lg">Empty Container</div>
    </#if>
            </div>
<#else>
            <div className="p-4 border border-orange-500/50 bg-orange-500/10 text-orange-500 rounded">
                Unsupported UI Component: ${component.type()}
            </div>
</#if>
</#macro>

<#if uiSpec?? && uiSpec.components()??>
<#list uiSpec.components() as comp>
    <@renderComponent component=comp />
</#list>
<#else>
            <div className="text-zinc-500">Dashboard is relatively empty. Use the Page Builder to customize this view.</div>
</#if>
        </div>
    );
}
