import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Check, X, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServerWait = () => {
    const navigate = useNavigate();
    const [handshake, setHandshake] = useState<any>(null);

    useEffect(() => {
        window.api.startServer();

        window.api.onHandshakeRequest((data: any) => {
            setHandshake(data);
        });
    }, []);

    const accept = () => {
        window.api.acceptHandshake();
        navigate('/transfer', { state: { isReceiver: true } });
    };

    const decline = () => {
        window.api.declineHandshake();
        setHandshake(null);
    };

    return (
        <div className="relative flex flex-col items-center justify-center space-y-6 py-20">
            <button
                onClick={() => navigate('/')}
                className="absolute top-0 left-0 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                disabled={!!handshake}
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            {!handshake ? (
                <>
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
                </>
            ) : (
                <div className="w-full max-w-md bg-gray-800 border-2 border-blue-500 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-blue-500/20 rounded-full text-blue-400">
                            <Monitor size={48} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Incoming Connection</h2>
                            <p className="text-gray-400 mt-1">
                                <span className="font-semibold text-blue-300">{handshake.hostname}</span> is asking to send data.
                            </p>
                            <div className="mt-2 text-xs text-gray-500 uppercase tracking-wider">
                                OS: {handshake.os}
                            </div>
                        </div>

                        <div className="flex space-x-4 w-full pt-4">
                            <button
                                onClick={decline}
                                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                            >
                                <X size={20} />
                                <span>Decline</span>
                            </button>
                            <button
                                onClick={accept}
                                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                            >
                                <Check size={20} />
                                <span>Accept</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServerWait;
