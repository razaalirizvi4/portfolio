import { useState } from 'react';
import { ChevronLeft, ChevronRight, Home, MoreHorizontal, Folder, FileText, Code, Globe, Database, Gamepad2 } from 'lucide-react';

const ProjectsApp = () => {
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const projects = [
        {
            id: 'twin',
            name: 'Twin (AI CLI Assistant)',
            type: 'folder',
            size: '2.4 MB',
            modified: '12/15/2024',
            description: 'AI-powered tool that converts natural language to executable shell commands',
            tech: 'Python, Shell, Ollama',
            icon: <Code size={24} className="text-blue-600" />
        },
        {
            id: 'cinema',
            name: 'Absolute Cinema',
            type: 'folder',
            size: '15.7 MB',
            modified: '11/28/2024',
            description: 'Full-stack movie booking system with real-time engine and Stripe integration',
            tech: 'Java, Spring Boot',
            icon: <Globe size={24} className="text-green-600" />
        },
        {
            id: 'rateit',
            name: 'RateIt Platform',
            type: 'folder',
            size: '8.3 MB',
            modified: '10/22/2024',
            description: 'Community-driven media rating platform with gamification features',
            tech: 'Node.js, React.js',
            icon: <Database size={24} className="text-purple-600" />
        },
        {
            id: 'hexaclash',
            name: 'HexaClash Mobile Game',
            type: 'folder',
            size: '45.2 MB',
            modified: '09/15/2024',
            description: 'Android game co-developed during MLabs incubation',
            tech: 'Unity, C#',
            icon: <Gamepad2 size={24} className="text-orange-600" />
        },
        {
            id: 'readme',
            name: 'README.md',
            type: 'file',
            size: '2.1 KB',
            modified: '01/08/2025',
            description: 'Project portfolio overview and setup instructions',
            tech: 'Markdown',
            icon: <FileText size={24} className="text-gray-600" />
        }
    ];

    return (
        <div className="win-explorer h-full flex flex-col">
            {/* Toolbar */}
            <div className="win-explorer-toolbar">
                <div className="win-explorer-nav">
                    <button className="win-nav-button" disabled>
                        <ChevronLeft size={16} />
                    </button>
                    <button className="win-nav-button" disabled>
                        <ChevronRight size={16} />
                    </button>
                    <button className="win-nav-button">
                        <Home size={16} />
                    </button>
                </div>
                
                <div className="win-address-bar">
                    <span>This PC &gt; Projects</span>
                </div>
                
                <input 
                    type="text" 
                    placeholder="Search Projects"
                    className="win-search-box"
                />
                
                <button className="win-nav-button">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="win-explorer-sidebar">
                    <div className="win-sidebar-section">
                        <div className="win-sidebar-header">Quick Access</div>
                        <button className="win-sidebar-item active">
                            <Folder className="win-sidebar-icon" />
                            Projects
                        </button>
                        <button className="win-sidebar-item">
                            <Folder className="win-sidebar-icon" />
                            Documents
                        </button>
                        <button className="win-sidebar-item">
                            <Folder className="win-sidebar-icon" />
                            Downloads
                        </button>
                    </div>
                    
                    <div className="win-sidebar-section">
                        <div className="win-sidebar-header">This PC</div>
                        <button className="win-sidebar-item">
                            <Folder className="win-sidebar-icon" />
                            Desktop
                        </button>
                        <button className="win-sidebar-item">
                            <Folder className="win-sidebar-icon" />
                            Documents
                        </button>
                        <button className="win-sidebar-item">
                            <Folder className="win-sidebar-icon" />
                            Pictures
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="win-explorer-content">
                    {viewMode === 'grid' ? (
                        <div className="win-file-grid">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className={`win-file-item ${selectedProject === project.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedProject(project.id)}
                                    onDoubleClick={() => {
                                        // Handle opening project
                                        console.log('Opening project:', project.name);
                                    }}
                                >
                                    <div className="win-file-icon">
                                        {project.icon}
                                    </div>
                                    <div className="win-file-name">
                                        {project.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="win-list-view">
                            <div className="win-list-header">
                                <div>Name</div>
                                <div>Size</div>
                                <div>Date modified</div>
                                <div>Type</div>
                            </div>
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className={`win-list-item ${selectedProject === project.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedProject(project.id)}
                                >
                                    <div className="win-list-item-name">
                                        {project.icon}
                                        {project.name}
                                    </div>
                                    <div className="win-list-item-details">{project.size}</div>
                                    <div className="win-list-item-details">{project.modified}</div>
                                    <div className="win-list-item-details">{project.type === 'folder' ? 'File folder' : 'Text Document'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-gray-100 border-t border-gray-300 px-4 py-2 text-sm text-gray-600 flex justify-between">
                <span>{projects.length} items</span>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`px-2 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : ''}`}
                    >
                        Grid
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`px-2 py-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : ''}`}
                    >
                        List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectsApp;
