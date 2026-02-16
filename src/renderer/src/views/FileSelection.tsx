import { useEffect, useState } from 'react';
import { HardDrive, Folder, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppData {
    name: string;
    size: number;
    selected: boolean;
    paths: string[];
}

interface UserFolder {
    name: string;
    path: string;
    size: number;
    selected: boolean;
}

const FileSelection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [apps, setApps] = useState<AppData[]>([]);
    const [folders, setFolders] = useState<UserFolder[]>([]);

    useEffect(() => {
        loadSystemData();
    }, []);

    const loadSystemData = async () => {
        try {
            setLoading(true);
            const data = await window.api.getSystemData();
            console.log('System Data:', data);
            setApps(data.apps || []);
            setFolders(data.folders || []);
        } catch (err) {
            console.error('Failed to load system data', err);
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const toggleApp = (index: number) => {
        const newApps = [...apps];
        newApps[index].selected = !newApps[index].selected;
        setApps(newApps);
    };

    const toggleFolder = (index: number) => {
        const newFolders = [...folders];
        newFolders[index].selected = !newFolders[index].selected;
        setFolders(newFolders);
    };

    const totalSize = [...apps, ...folders]
        .filter(i => i.selected)
        .reduce((acc, curr) => acc + curr.size, 0);

    const startBackup = () => {
        // TODO: Send selection to backend and start transfer
        console.log('Starting backup...');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p className="text-gray-400">Scanning system files...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <header className="flex items-center justify-between pb-4 border-b border-gray-700">
                <div>
                    <h2 className="text-xl font-bold">Select Data to Backup</h2>
                    <p className="text-sm text-gray-400">Choose applications and folders to transfer</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-400">Total Selected</div>
                    <div className="text-2xl font-bold text-blue-400">{formatSize(totalSize)}</div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                {/* Applications Section */}
                <section>
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-300">
                        <HardDrive size={20} />
                        <span>Applications</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {apps.length === 0 ? (
                            <p className="text-gray-500 text-sm ml-6">No supported applications found.</p>
                        ) : (
                            apps.map((app, idx) => (
                                <div
                                    key={app.name}
                                    onClick={() => toggleApp(idx)}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${app.selected
                                            ? 'bg-blue-500/10 border-blue-500/50'
                                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${app.selected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                                            }`}>
                                            {app.selected && <Check size={14} className="text-white" />}
                                        </div>
                                        <span className="font-medium">{app.name}</span>
                                    </div>
                                    <span className="text-sm text-gray-400">{formatSize(app.size)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* User Folders Section */}
                <section>
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-300">
                        <Folder size={20} />
                        <span>User Folders</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {folders.map((folder, idx) => (
                            <div
                                key={folder.name}
                                onClick={() => toggleFolder(idx)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${folder.selected
                                        ? 'bg-purple-500/10 border-purple-500/50'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${folder.selected ? 'bg-purple-500 border-purple-500' : 'border-gray-500'
                                        }`}>
                                        {folder.selected && <Check size={14} className="text-white" />}
                                    </div>
                                    <span className="font-medium">{folder.name}</span>
                                </div>
                                <span className="text-sm text-gray-400">{formatSize(folder.size)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="pt-4 border-t border-gray-700 flex justify-end">
                <button
                    onClick={startBackup}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all"
                >
                    Start Transfer
                </button>
            </div>
        </div>
    );
};

export default FileSelection;
