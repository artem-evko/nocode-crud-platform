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

export default function Dashboard() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
<#macro renderComponent component>
<#if component.type() == "Heading">
            <h2 className="text-3xl font-bold tracking-tight text-white dark:text-zinc-50 mb-2">${component.props()['text']!'Heading'}</h2>
<#elseif component.type() == "Text">
            <p className="text-zinc-500 max-w-2xl">${component.props()['text']!'Text block'}</p>
<#elseif component.type() == "Button">
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors shadow-sm text-white">
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
