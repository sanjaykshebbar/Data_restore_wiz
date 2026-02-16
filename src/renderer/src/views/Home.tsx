import { useNavigate } from 'react-router-dom';
import { Server, MonitorSmartphone } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-10">
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
