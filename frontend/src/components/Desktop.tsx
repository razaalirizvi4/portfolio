import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Code, Dribbble, FileText } from 'lucide-react';
import Taskbar from './Taskbar';
import Window from './Window';
import StartMenu from './StartMenu';

// Apps
import AboutApp from '../apps/AboutApp';
import ProjectsApp from '../apps/ProjectsApp';
import BasketballApp from '../apps/BasketballApp';
import SkillsApp from '../apps/SkillsApp';

interface AppConfig {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const Desktop = () => {
    const [openApps, setOpenApps] = useState<AppConfig[]>([]);
    const [activeApp, setActiveApp] = useState<string | null>(null);
    const [isStartOpen, setIsStartOpen] = useState(false);

    const apps: AppConfig[] = [
        {
            id: 'about',
            title: 'About Me.txt',
            icon: <User className="text-blue-500" />,
            content: <AboutApp />
        },
        {
            id: 'projects',
            title: 'Projects Explorer',
            icon: <Briefcase className="text-orange-500" />,
            content: <ProjectsApp />
        },
        {
            id: 'skills',
            title: 'Technical Terminal',
            icon: <Code className="text-green-500" />,
            content: <SkillsApp />
        },
        {
            id: 'basketball',
            title: 'The Basketball Story',
            icon: <Dribbble className="text-orange-600" />,
            content: <BasketballApp />
        },
        {
            id: 'resume',
            title: 'Resume.pdf',
            icon: <FileText className="text-red-500" />,
            content: (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-8">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
                        <FileText size={64} className="text-red-500 mb-6 mx-auto" />
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Resume</h2>
                        <p className="mb-6 text-gray-600">Syed_Raza_Ali_Rizvi_Resume.pdf</p>
                        <a 
                            href="/raza.pdf" 
                            target="_blank" 
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            <FileText size={20} />
                            View / Download PDF
                        </a>
                    </div>
                </div>
            )
        },
    ];

    const toggleApp = (id: string) => {
        const app = apps.find(a => a.id === id);
        if (!app) return;

        if (openApps.find(a => a.id === app.id)) {
            setActiveApp(app.id);
        } else {
            setOpenApps([...openApps, app]);
            setActiveApp(app.id);
        }
    };

    const closeApp = (id: string) => {
        setOpenApps(openApps.filter(a => a.id !== id));
        if (activeApp === id) setActiveApp(null);
    };

    return (
        <div 
            className="h-screen w-screen relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
        >
            {/* Desktop Icons */}
            <div className="absolute top-4 left-4 flex flex-col gap-4 z-10">
                {apps.map((app, index) => (
                    <motion.div
                        key={app.id}
                        className="win-desktop-icon"
                        onDoubleClick={() => toggleApp(app.id)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                        <div className="win-desktop-icon-image">
                            {React.cloneElement(app.icon as React.ReactElement<any>, { size: 32 })}
                        </div>
                        <span className="win-desktop-icon-label">
                            {app.title}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Windows */}
            <AnimatePresence>
                {openApps.map(app => (
                    <Window
                        key={app.id}
                        title={app.title}
                        icon={app.icon}
                        onClose={() => closeApp(app.id)}
                        onMinimize={() => setActiveApp(null)}
                        active={activeApp === app.id}
                        onClick={() => setActiveApp(app.id)}
                    >
                        {app.content}
                    </Window>
                ))}
            </AnimatePresence>

            <StartMenu
                isOpen={isStartOpen}
                onClose={() => setIsStartOpen(false)}
                onAppClick={toggleApp}
                apps={apps}
            />

            <Taskbar
                openApps={openApps}
                activeApp={activeApp}
                onAppClick={(id) => setActiveApp(id === activeApp ? null : id)}
                onStartClick={() => setIsStartOpen(!isStartOpen)}
            />
        </div>
    );
};

export default Desktop;
