import { useNavigate } from 'react-router-dom';
import { Server, MonitorSmartphone, Shield, User, Monitor, Laptop, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MachineInfo } from '../../../shared/constants';

const Home = () => {
    const navigate = useNavigate();
    const [info, setInfo] = useState<MachineInfo | null>(null);

    useEffect(() => {
        window.api.getMachineInfo().then(setInfo);
    }, []);

    return (
        <div className="flex flex-col items-center space-y-8 py-4">
            {/* System Info Panel */}
            {info && (
                <div className="w-full max-w-2xl bg-gray-800/50 border border-gray-700 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2 text-gray-300">
                        <Monitor size={16} className="text-blue-400" />
                        <span className="font-semibold">Host:</span>
                        <span className="truncate">{info.hostname}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                        <User size={16} className="text-purple-400" />
                        <span className="font-semibold">User:</span>
                        <span>{info.username}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                        <Shield size={16} className={info.userType === 'Admin' ? 'text-green-400' : 'text-yellow-400'} />
                        <span className="font-semibold">Type:</span>
                        <span>{info.userType}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                        <Info size={16} className="text-blue-400" />
                        <span className="font-semibold">IP:</span>
                        <span>{info.ipAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                        <Laptop size={16} className="text-purple-400" />
                        <span className="font-semibold">OS:</span>
                        <span>{info.os}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300 col-span-1 md:col-span-1">
                        <Monitor size={16} className="text-gray-400" />
                        <span className="font-semibold">Ver:</span>
                        <span className="truncate text-xs">{info.osVersion}</span>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-medium text-gray-300">Select Machine Role</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <button
                    onClick={() => navigate('/server-wait')}
                    className="group flex flex-col items-center p-8 bg-gray-750 border-2 border-gray-700 rounded-2xl hover:border-blue-500 hover:bg-gray-700/50 transition-all duration-300"
                >
                    <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors mb-4">
                        <Server size={48} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Receiver (New Machine)</h3>
                    <p className="text-gray-400 text-center text-sm">
                        Waiting for data from another computer.
                    </p>
                </button>

                <button
                    onClick={() => navigate('/discovery')}
                    className="group flex flex-col items-center p-8 bg-gray-750 border-2 border-gray-700 rounded-2xl hover:border-purple-500 hover:bg-gray-700/50 transition-all duration-300"
                >
                    <div className="p-4 rounded-full bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors mb-4">
                        <MonitorSmartphone size={48} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Sender (Old Machine)</h3>
                    <p className="text-gray-400 text-center text-sm">
                        Send data to a new computer.
                    </p>
                </button>
            </div>
        </div>
    );
};

export default Home;
