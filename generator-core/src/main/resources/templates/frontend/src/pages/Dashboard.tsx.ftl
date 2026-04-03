// @ts-nocheck
import React, { useState, useEffect } from 'react';
<#if entities??>
<#list entities as entity>
import ${entity.name()}List from './${entity.name()}List';
import ${entity.name()}Form from './${entity.name()}Form';
</#list>
</#if>
import { api } from '../lib/api';
<#if authEnabled?? && authEnabled>
import { useAuthStore } from '../store/authStore';
</#if>
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DynamicChart = ({ type, entityName, xAxisKey, yAxisKey, className }) => {
    const [data, setData] = useState([]);
    useEffect(() => {
        if (!entityName) return;
        api.get('/' + entityName.toLowerCase()).then(res => setData(res.data)).catch(console.error);
    }, [entityName]);

    if (!entityName) return <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 rounded my-4">Chart component missing 'entityName' binding.</div>;

    const RealChart = type === 'BarChart' ? BarChart : LineChart;
    const RealElement = type === 'BarChart' ? Bar : Line;

    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 mb-6 shadow-md p-6 ${r"${className || ''}"}`}>
            <h3 className="font-semibold text-white tracking-wide mb-4">{entityName} Chart</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RealChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey={xAxisKey || 'id'} stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                        <RealElement type="monotone" dataKey={yAxisKey || 'value'} fill={type === 'BarChart' ? '#8b5cf6' : undefined} stroke={type === 'LineChart' ? '#06b6d4' : undefined} strokeWidth={type === 'LineChart' ? 3 : undefined} dot={type === 'LineChart' ? { r: 4, fill: '#06b6d4' } : undefined} radius={type === 'BarChart' ? [4, 4, 0, 0] : undefined} />
                    </RealChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default function Dashboard() {
    <#if authEnabled?? && authEnabled>
    const { user, isAuthenticated } = useAuthStore();
    </#if>

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
<#macro renderComponent component>
<#if component.type() == "Heading">
            <h2 className="text-3xl font-bold tracking-tight text-white dark:text-zinc-50 mb-2 ${component.props()['className']!''}">${component.props()['text']!'Heading'}</h2>
<#elseif component.type() == "Text">
            <p className="text-zinc-500 max-w-2xl ${component.props()['className']!''}">${component.props()['text']!'Text block'}</p>
<#elseif component.type() == "Button">
            <button 
                <#if component.props()['actionFlowId']??>
                onClick={() => {
                    api.post('/actions/${component.props()['actionFlowId']}', {})
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
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors shadow-sm text-white ${component.props()['className']!''}"
            >
                ${component.props()['text']!'Button'}
            </button>
<#elseif component.type() == "DataTable">
    <#if component.props()['entityName']??>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 mb-6 shadow-xl ${component.props()['className']!''}">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6 mb-6 max-w-2xl shadow-xl ${component.props()['className']!''}">
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
<#elseif component.type() == "BarChart" || component.type() == "LineChart">
            <DynamicChart 
                type="${component.type()}" 
                entityName="${component.props()['entityName']!''}" 
                xAxisKey="${component.props()['xAxisKey']!''}" 
                yAxisKey="${component.props()['yAxisKey']!''}" 
                className="${component.props()['className']!''}" 
            />
<#elseif component.type() == "Image">
            <img 
                src="${component.props()['url']!'https://via.placeholder.com/400x200?text=Image+Placeholder'}" 
                alt="Image" 
                className="rounded-lg object-cover max-w-full ${component.props()['className']!''}" 
            />
<#elseif component.type() == "Divider">
            <hr className="w-full border-zinc-800 ${component.props()['className']!''}" />
<#elseif component.type() == "Container">
            <div className="flex flex-col gap-4 p-6 border border-zinc-800 rounded-xl bg-zinc-900/30 w-full mb-4 ${component.props()['className']!''}">
    <#if component.children()?? && component.children()?size \gt 0>
        <#list component.children() as child>
                <@renderComponent component=child />
        </#list>
    <#else>
                <div className="text-zinc-500 text-sm text-center py-4 border-2 border-dashed border-zinc-800 rounded-lg">Empty Container</div>
    </#if>
            </div>
<#elseif component.type() == "Card">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6 hover:border-zinc-700 transition-colors ${component.props()['className']!''}">
                <p className="text-zinc-300 whitespace-pre-wrap">${component.props()['text']!'Описание карточки. Настройте текст в свойствах.'}</p>
            </div>
<#elseif component.type() == "Badge">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm ${component.props()['className']!''}">
                ${component.props()['text']!'Badge'}
            </span>
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
