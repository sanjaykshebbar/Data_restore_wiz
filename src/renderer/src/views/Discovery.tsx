import { useEffect, useState } from 'react';
import { Search, Monitor, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Peer {
    name: string;
    host: string;
    port: number;
    addresses: string[];
    txt: any;
}

const Discovery = () => {
    const navigate = useNavigate();
    const [peers, setPeers] = useState<Peer[]>([]);
    const [searching, setSearching] = useState(true);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualIp, setManualIp] = useState('');

    useEffect(() => {
        window.api.startScan();

        window.api.onScanResults((service: any) => {
            setPeers(prev => {
                if (prev.some(p => p.name === service.name)) return prev;
                return [...prev, service];
            });
        });

        window.api.onConnectionSuccess(() => {
            console.log('Connection successful, navigating to file selection...');
            navigate('/file-selection');
        });
    }, []);

    const connectTo = (ip: string) => {
        if (!ip) return;
        console.log(`Connecting to ${ip}...`);
        window.api.connectToServer(ip);
        // Navigate to transfer screen todo
    };

    return (
        <div className="flex flex-col h-full relative pt-10">
            <button
                onClick={() => navigate('/')}
                className="absolute top-0 left-0 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>
            <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Search className={`text-purple-400 ${searching ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Looking for Receiver...</h2>
                    <p className="text-sm text-gray-400">Searching for reachable computers on local network</p>
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {peers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        Scanning for devices...
                    </div>
                ) : (
                    peers.map((peer) => (
                        <div key={peer.name} className="flex items-center justify-between p-4 bg-gray-750 border border-gray-700 rounded-xl hover:border-purple-500 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-gray-700 rounded-lg">
                                    <Monitor className="text-gray-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{peer.name}</h3>
                                    <div className="text-xs text-gray-400 flex space-x-2">
                                        <span>{peer.addresses?.[0]}</span>
                                        <span>•</span>
                                        <span>{peer.txt?.os || 'Unknown OS'}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => connectTo(peer.addresses?.[0])}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Connect
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
                {!showManualInput ? (
                    <button
                        onClick={() => setShowManualInput(true)}
                        className="text-sm text-gray-400 hover:text-white underline"
                    >
                        Enter IP Manually
                    </button>
                ) : (
                    <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <input
                            type="text"
                            placeholder="192.168.1.x"
                            value={manualIp}
                            onChange={(e) => setManualIp(e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                            onKeyDown={(e) => e.key === 'Enter' && connectTo(manualIp)}
                        />
                        <button
                            onClick={() => connectTo(manualIp)}
                            disabled={!manualIp}
                            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => setShowManualInput(false)}
                            className="text-xs text-gray-500 hover:text-gray-300 ml-2"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Discovery;
