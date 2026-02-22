import { useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServerWait = () => {
    const navigate = useNavigate();
    useEffect(() => {
        window.api.startServer();
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center space-y-6 py-20">
            <button
                onClick={() => navigate('/')}
                className="absolute top-0 left-0 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse"></div>
                <Loader2 size={64} className="text-blue-400 animate-spin relative z-10" />
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Waiting for Connection...</h2>
                <p className="text-gray-400">
                    Open the app on your old computer and select <b>Sender</b>.
                </p>
            </div>

            <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-sm font-mono text-gray-300">
                <div className="flex justify-between w-64 mb-1">
                    <span>Port:</span>
                    <span className="text-blue-400">1234</span>
                </div>
                <div className="flex justify-between w-64">
                    <span>Status:</span>
                    <span className="text-green-400">Listening</span>
                </div>
            </div>
        </div>
    );
};

export default ServerWait;
