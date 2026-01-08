import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-cover bg-center flex items-center justify-center z-[9000]" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop")' }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6"
            >
                <div className="w-48 h-48 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center mb-8 overflow-hidden border border-white/30 shadow-2xl">
                    <User size={100} className="text-white" />
                </div>

                <h1 className="text-white text-4xl font-semibold mb-10 tracking-tight">Syed Raza Ali Rizvi</h1>

                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    <div className="relative w-72">
                        <input
                            type="password"
                            placeholder="PIN"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all text-center text-lg backdrop-blur-md"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowRight size={24} />
                        </button>
                    </div>
                    <p className="text-white/50 mt-6 text-sm cursor-pointer hover:text-white transition-colors font-medium">
                        Forgot PIN? (Type anything and press Enter)
                    </p>
                </form>
            </motion.div>

            <div className="absolute bottom-12 right-12 flex gap-8 text-white/70">
                <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-all">
                    <span>Wi-Fi</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-all">
                    <span>Power</span>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
