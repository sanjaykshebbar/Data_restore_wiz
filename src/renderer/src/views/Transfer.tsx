import { useEffect, useState, useRef } from 'react';
import { Loader2, ArrowRightCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface TransferStatus {
    currentFile: string;
    totalFiles: number;
    filesProcessed: number;
    totalBytes: number;
    bytesProcessed: number;
    speed: number;
}

const Transfer = () => {
    const [status, setStatus] = useState<TransferStatus | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const location = useLocation();

    const started = useRef(false);

    useEffect(() => {
        // If we just arrived here, start the backup if this is sender
        const start = async () => {
            if (started.current) return;
            if (location.state?.apps || location.state?.folders) {
                started.current = true;
                await window.api.startBackup(location.state.apps, location.state.folders);
            }
        };
        start();

        // Listen for progress
        window.api.onTransferProgress((data: any) => {
            setStatus(data);
        });

        // Listen for logs
        window.api.onLogMessage((msg: string) => {
            setLogs(prev => [...prev.slice(-4), msg]); // Keep last 5 logs
        });
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    const progress = status ? (status.bytesProcessed / status.totalBytes) * 100 : 0;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center space-x-4">
                <ArrowRightCircle className="animate-pulse text-green-400" size={32} />
                <div>
                    <h2 className="text-2xl font-bold">Transferring Data...</h2>
                    <p className="text-gray-400">Please do not close the application.</p>
                </div>
            </div>

            {status ? (
                <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="text-sm text-gray-400">Current File</div>
                            <div className="text-white truncate" title={status.currentFile}>
                                {status.currentFile}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="text-sm text-gray-400">Speed</div>
                            <div className="text-white">
                                {formatBytes(status.speed)}/s
                            </div>
                        </div>
                        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="text-sm text-gray-400">Progress</div>
                            <div className="text-white">
                                {formatBytes(status.bytesProcessed)} / {formatBytes(status.totalBytes)} ({Math.round(progress)}%)
                            </div>
                        </div>
                        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="text-sm text-gray-400">Files</div>
                            <div className="text-white">
                                {status.filesProcessed} / {status.totalFiles}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                    <p>Initializing transfer...</p>
                </div>
            )}

            {/* Logs */}
            <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-green-400 h-32 overflow-hidden border border-gray-700">
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>
        </div>
    );
};

export default Transfer;
