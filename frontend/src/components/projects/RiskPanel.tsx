import React, { useEffect, useState } from 'react';
import { riskService, Risk } from '@/services/risk.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, ShieldCheck, Loader2, Info } from 'lucide-react';

interface RiskPanelProps {
    projectId: string;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ projectId }) => {
    const [risks, setRisks] = useState<Risk[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchRisks();
    }, [projectId]);

    const fetchRisks = async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const data = await riskService.getProjectRisks(projectId, refresh);
            setRisks(data.risks);
        } catch (error) {
            console.error('Failed to fetch risks', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <div className='flex justify-center p-8'>
                <Loader2 className='w-6 h-6 animate-spin text-indigo-500' />
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h3 className='text-lg font-bold text-gray-900'>AI Risk Monitoring</h3>
                <div className='flex items-center space-x-2'>
                    {risks.length === 0 && (
                        <div className='flex items-center text-green-600 text-sm font-medium'>
                            <ShieldCheck className='w-4 h-4 mr-1' />
                            Healthy
                        </div>
                    )}
                    <button
                        onClick={() => fetchRisks(true)}
                        disabled={isRefreshing}
                        className='p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors'
                        title='Refresh Analysis'
                    >
                        <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {risks.length === 0 ? (
                <Card className='p-8 text-center bg-green-50 border-green-100'>
                    <ShieldCheck className='w-12 h-12 text-green-400 mx-auto mb-3' />
                    <h4 className='text-green-800 font-semibold'>Your project is healthy!</h4>
                    <p className='text-sm text-green-600 mt-1'>
                        AI analysis didn't find any immediate bottlenecks or delays.
                    </p>
                </Card>
            ) : (
                <div className='grid grid-cols-1 gap-3'>
                    {risks.map((risk, idx) => (
                        <Card
                            key={idx}
                            className={`p-4 border-l-4 ${
                                risk.level === 'High'
                                    ? 'border-l-red-500 bg-red-50/30'
                                    : risk.level === 'Medium'
                                      ? 'border-l-yellow-500 bg-yellow-50/30'
                                      : 'border-l-blue-500 bg-blue-50/30'
                            }`}
                        >
                            <div className='flex items-start justify-between'>
                                <div className='flex items-start space-x-3'>
                                    <div
                                        className={`p-2 rounded-lg ${
                                            risk.level === 'High'
                                                ? 'bg-red-100 text-red-600'
                                                : risk.level === 'Medium'
                                                  ? 'bg-yellow-100 text-yellow-600'
                                                  : 'bg-blue-100 text-blue-600'
                                        }`}
                                    >
                                        <AlertTriangle className='w-4 h-4' />
                                    </div>
                                    <div>
                                        <div className='flex items-center space-x-2'>
                                            <h4 className='font-bold text-gray-900'>{risk.type}</h4>
                                            <Badge
                                                variant={
                                                    risk.level === 'High'
                                                        ? 'danger'
                                                        : risk.level === 'Medium'
                                                          ? 'warning'
                                                          : 'info'
                                                }
                                            >
                                                {risk.level} Risk
                                            </Badge>
                                        </div>
                                        <p className='text-sm text-gray-600 mt-1'>{risk.description}</p>
                                    </div>
                                </div>
                            </div>

                            {risk.suggestions.length > 0 && (
                                <div className='mt-3 pt-3 border-t border-gray-100'>
                                    <p className='text-xs font-bold text-gray-500 uppercase flex items-center mb-2'>
                                        <Info className='w-3 h-3 mr-1' /> AI Suggestions:
                                    </p>
                                    <ul className='space-y-1'>
                                        {risk.suggestions.map((s, sIdx) => (
                                            <li
                                                key={sIdx}
                                                className='text-xs text-gray-700 flex items-start'
                                            >
                                                <span className='mr-1.5 mt-1 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0'></span>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
