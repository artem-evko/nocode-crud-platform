import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient, downloadProjectCode } from '../api/client';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge
} from '@xyflow/react';
import type { Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, PlusCircle, Download, Settings, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectFormData } from '../components/ProjectModal';
import { compileToSpec } from '../lib/compiler';
import EntityNode from '../components/EntityNode';
import type { AppNode } from '../components/EntityNode';
import ProjectSettingsModal from '../components/ProjectSettingsModal';

const nodeTypes = {
    entity: EntityNode,
};

// A helper for generating simple IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ModelerPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const [project, setProject] = useState<ProjectFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        apiClient.get('/auth/me')
            .then((res) => {
                setUser(res.data);
                fetchProject();
            })
            .catch(() => {
                setUser(null);
                navigate('/login');
            });
        // eslint-disable-next-react-hooks/exhaustive-deps
    }, [navigate, setUser, projectId]);

    const fetchProject = async () => {
        try {
            const response = await apiClient.get<any[]>('/projects');
            const found = response.data.find(p => p.id === projectId);
            if (found) {
                setProject(found);
                if (found.specText && found.specText !== '{}') {
                    try {
                        const parsed = JSON.parse(found.specText);

                        // Handle the new wrapper format `{"flow": {nodes, edges}, "spec": {...}}`
                        // or fallback to the old format if it was saved prior to generator integration
                        let flowData = parsed;

                        if (parsed._flow) {
                            // This is the new generator-compatible format
                            flowData = parsed._flow;
                        } else if (parsed.flow) {
                            flowData = parsed.flow;
                        } else if (parsed.specVersion) {
                            // This is a plain spec without flow data (user generated from outside?)
                            // We could theoretically try to reverse-engineer nodes here, but for now we skip
                            flowData = {};
                        }

                        if (parsed.project) {
                            if (parsed.project.authEnabled !== undefined) {
                                found.authEnabled = parsed.project.authEnabled;
                            }
                            if (parsed.project.generateFrontend !== undefined) {
                                found.generateFrontend = parsed.project.generateFrontend;
                            }
                        }

                        if (flowData.nodes) setNodes(flowData.nodes);
                        if (flowData.edges) setEdges(flowData.edges);
                    } catch (e) {
                        console.error('Failed to parse specText', e);
                    }
                }
                setProject(found);
            } else {
                navigate('/projects');
            }
        } catch (error) {
            console.error("Failed to fetch project", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = useCallback((nodeId: string, newName: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, name: newName } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const handleAddField = useCallback((nodeId: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    const newField = { id: generateId(), name: 'newField', type: 'String' as const, required: false };
                    return { ...node, data: { ...node.data, fields: [...(node.data.fields || []), newField] } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const handleRemoveField = useCallback((nodeId: string, fieldId: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, fields: node.data.fields.filter(f => f.id !== fieldId) } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const handleFieldChange = useCallback((nodeId: string, fieldId: string, updates: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            fields: node.data.fields.map(f => (f.id === fieldId ? { ...f, ...updates } : f)),
                        }
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    const handleRolesChange = useCallback((nodeId: string, updates: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...updates
                        }
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    // Attach callbacks to nodes whenever they change or initially render
    const nodesWithCallbacks = useMemo(() => {
        return nodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                onNameChange: handleNameChange,
                onAddField: handleAddField,
                onRemoveField: handleRemoveField,
                onFieldChange: handleFieldChange,
                onRolesChange: handleRolesChange,
            },
        }));
    }, [nodes, handleNameChange, handleAddField, handleRemoveField, handleFieldChange, handleRolesChange]);

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const addNewEntity = () => {
        const newNode: AppNode = {
            id: generateId(),
            type: 'entity',
            position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: {
                name: 'NewEntity',
                fields: [
                    { id: generateId(), name: 'id', type: 'UUID', required: true }
                ]
            }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const handleSave = async () => {
        if (!project || !project.id) return;
        try {
            // Strip out functions from the nodes before saving
            const serializableNodes = nodes.map(n => {
                const { onNameChange, onAddField, onRemoveField, onFieldChange, onRolesChange, ...safeData } = n.data;
                return { ...n, data: safeData };
            });

            // We compile the visual layout into the strict Backend Spec
            const rawSpecText = compileToSpec(project, nodes, edges);
            const specObj = JSON.parse(rawSpecText);

            // To prevent losing X/Y coordinates when reloading the page, we wrap the payload.
            // But wait, ProjectDownloadController uses `mapper.readValue(p.getSpecText(), Spec.class)`.
            // If we wrap it, the GeneratorFacade will crash. 
            // We must update GeneratorFacade to accept the wrapper, or handle visual data differently.
            // For now, let's keep it clean since that's what we discovered. Just save the spec as-is 
            // and we rely on the `fetchProject` reverse-engineering if we want coords.

            // Let's actually use a trick: Jackson ObjectMapper ignores unknown properties by default 
            // if configured (but YAMLFactory is strict).

            // Let's modify the Spec JSON to include an extra `_flow` root property. 
            // If the backend `Spec.class` doesn't reject it, we get to keep our layout data!
            const wrapper = {
                ...specObj,
                _flow: {
                    nodes: serializableNodes,
                    edges
                }
            };

            const specText = JSON.stringify(wrapper, null, 2);

            await apiClient.put(`/projects/${project.id}`, {
                ...project,
                specText
            });
            toast.success('Model saved successfully!');
        } catch (error) {
            console.error('Failed to save model', error);
            toast.error('Error saving model');
        }
    };

    const handleGenerate = async () => {
        if (!project || !project.id) return;

        try {
            // Make sure the user saves first, but we will just attempt to download
            const response = await downloadProjectCode(project.id);

            // Extract filename from header if possible, else default 
            let filename = `${project.artifactId || 'project'} -${project.version || '1.0.0'}.zip`;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch != null && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // Create a pseudo-link to initiate the browser download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Code generated and downloaded successfully!");

        } catch (error) {
            console.error('Failed to generate project codebase', error);
            toast.error('Error generating project codebase. Have you saved your model first?');
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-zinc-950 text-slate-50 overflow-hidden">
            <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/projects')}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Back to Projects"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{project?.name} <span className="text-sm font-normal text-zinc-400">Modeler</span></h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-zinc-700 hover:border-zinc-600"
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                    <button
                        onClick={() => navigate(`/projects/${projectId}/builder`)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-zinc-700 hover:border-zinc-600"
                    >
                        <LayoutTemplate size={16} />
                        UI Builder
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 hover:text-emerald-300 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-emerald-600/30"
                    >
                        <Download size={16} />
                        Generate Code
                    </button>
                    <button
                        onClick={addNewEntity}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-zinc-700 hover:border-zinc-600"
                    >
                        <PlusCircle size={16} />
                        Add Entity
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Save size={16} />
                        Save Model
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full h-full relative" style={{ minHeight: 0 }}>
                <ReactFlow
                    nodes={nodesWithCallbacks}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    colorMode="dark"
                    fitView
                >
                    <Background color="#52525b" gap={16} size={1} />
                    <Controls className="bg-zinc-900 border-zinc-800 fill-white" />
                </ReactFlow>
            </div>

            <ProjectSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={{
                    authEnabled: project?.authEnabled || false,
                    generateFrontend: project?.generateFrontend || false
                }}
                onSave={(settings) => {
                    if (project) {
                        setProject(prev => prev ? {
                            ...prev,
                            authEnabled: settings.authEnabled,
                            generateFrontend: settings.generateFrontend
                        } : prev);
                    }
                }}
            />
        </div>
    );
}
