import React, { useState, useEffect, useRef } from 'react';

const SkillsApp = () => {
    const [history, setHistory] = useState<string[]>([
        "Microsoft Windows [Version 11.0.22000.1]",
        "(c) Microsoft Corporation. All rights reserved.",
        "",
        "C:\\Users\\raza> raza --list-skills"
    ]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const skills = {
        languages: ["Java", "Python", "C/C++", "JavaScript", "SQL", "HTML/CSS"],
        frameworks: ["React.js", "Node.js", "Express.js", "Spring Boot", "Tailwind CSS"],
        tools: ["Git", "VS Code", "Vite", "Firebase", "Linux", "Ollama"]
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = input.trim().toLowerCase();
        let response = "";

        if (cmd === "ls" || cmd === "dir") {
            response = "languages/  frameworks/  tools/  experience.txt  resume.pdf";
        } else if (cmd === "raza --list-skills") {
            response = `LANGUAGES: ${skills.languages.join(", ")}\nFRAMEWORKS: ${skills.frameworks.join(", ")}\nTOOLS: ${skills.tools.join(", ")}`;
        } else if (cmd === "help") {
            response = "Available commands: dir, help, cls, raza --list-skills, whoami, date, ver";
        } else if (cmd === "cls" || cmd === "clear") {
            setHistory([
                "Microsoft Windows [Version 11.0.22000.1]",
                "(c) Microsoft Corporation. All rights reserved.",
                ""
            ]);
            setInput("");
            return;
        } else if (cmd === "whoami") {
            response = "raza\\Syed Raza Ali Rizvi - Problem Solver & Fullstack Developer";
        } else if (cmd === "date") {
            response = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } else if (cmd === "ver") {
            response = "Microsoft Windows [Version 11.0.22000.1]";
        } else if (cmd !== "") {
            response = `'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.`;
        }

        setHistory([...history, `C:\\Users\\raza> ${input}`, response, ""]);
        setInput("");
    };

    return (
        <div className="win-terminal h-full" onClick={() => document.getElementById('terminal-input')?.focus()}>
            <div ref={scrollRef} className="h-full overflow-auto">
                <div className="whitespace-pre-wrap">
                    {history.map((line, i) => (
                        <div key={i} className={`win-terminal-line ${
                            line.startsWith("C:\\Users\\raza>") ? "win-terminal-prompt" : 
                            line.includes("LANGUAGES:") || line.includes("FRAMEWORKS:") || line.includes("TOOLS:") ? "win-terminal-output" : ""
                        }`}>
                            {line}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleCommand} className="flex items-center">
                    <span className="win-terminal-prompt">C:\Users\raza&gt;</span>
                    <input
                        id="terminal-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="win-terminal-input ml-1"
                        autoFocus={true}
                    />
                    <div className="win-terminal-cursor" />
                </form>

                <div className="mt-4 text-xs text-gray-500 border-t border-gray-700 pt-2">
                    Tip: Try typing 'help' or 'dir' to explore available commands.
                </div>
            </div>
        </div>
    );
};

export default SkillsApp;
