import React from 'react';
import { FiUsers, FiMessageSquare, FiGlobe } from 'react-icons/fi';

const AgentCard = ({ agentId, agentImage, agentName, status, userCount, messageCount, modelType, hasWebSearch, hideActionIcons }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="h-32 sm:h-36 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900">
                {agentImage ? (
                    <img 
                        src={agentImage} 
                        alt={agentName} 
                        className="w-full h-full object-cover object-center opacity-90 dark:opacity-80 transition-transform hover:scale-105 duration-300" 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/img.png'; // Fallback to default image
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-purple-100/50 dark:from-blue-900/30 dark:to-purple-900/30">
                        <span className={`text-3xl sm:text-4xl text-gray-500/40 dark:text-white/30`}>{agentName.charAt(0)}</span>
                    </div>
                )}
            </div>
            
            <div className="p-4">
                <h3 className="font-medium text-base mb-1 truncate">{agentName}</h3>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>{modelType || 'Unknown model'}</span>
                </div>
                
                {hasWebSearch && (
                    <div className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 mb-2">
                        <FiGlobe size={12} />
                        <span>Web search</span>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <FiUsers className="text-gray-500" />
                        <span>{userCount || 0} users</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FiMessageSquare className="text-gray-500" />
                        <span>{messageCount || 0} msgs</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentCard;