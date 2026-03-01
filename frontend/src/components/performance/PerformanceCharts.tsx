import React, { useEffect, useState } from 'react';
import { performanceService, PerformanceStats } from '@/services/performance.service';
import { authService } from '@/services/auth.service';
import { Card } from '@/components/ui/Card';
import { Loader2, TrendingUp, Award, Clock, Activity } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface PerformanceChartsProps {
    projectId?: string;
    userId?: string;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ projectId }) => {
    const [data, setData] = useState<PerformanceStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [insights, setInsights] = useState<string[]>([]);
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        fetchPerformance();
    }, [projectId]);

    const fetchPerformance = async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            if (projectId) {
                const result = await performanceService.getProjectPerformance(projectId);
                setData(result.members);
            } else {
                const result = await performanceService.getTeamPerformance();
                setData(result.members);
            }
            const insightData = await performanceService.getAiInsights(refresh);
            setInsights(insightData.suggestions);
        } catch (error) {
            console.error('Failed to fetch performance data', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <div className='flex justify-center p-12'>
                <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
            </div>
        );
    }

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const userStats = data.find(d => d.userId === currentUser?.id) || (data.length > 0 ? data[0] : null);

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h3 className='text-xl font-bold text-gray-900'>Performance Analytics</h3>
                <button
                    onClick={() => fetchPerformance(true)}
                    disabled={isRefreshing}
                    className='p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors flex items-center space-x-2 text-sm font-medium'
                >
                    <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {userStats && (
                    <>
                        <Card className='p-4 flex items-center space-x-4'>
                            <div className='p-3 bg-indigo-100 rounded-full'>
                                <TrendingUp className='w-6 h-6 text-indigo-600' />
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Your Score</p>
                                <p className='text-2xl font-bold text-gray-900'>
                                    {Math.round(userStats.productivityScore)}%
                                </p>
                            </div>
                        </Card>
                        <Card className='p-4 flex items-center space-x-4'>
                            <div className='p-3 bg-green-100 rounded-full'>
                                <Award className='w-6 h-6 text-green-600' />
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Tasks Completed</p>
                                <p className='text-2xl font-bold text-gray-900'>{userStats.completedTasks}</p>
                            </div>
                        </Card>
                        <Card className='p-4 flex items-center space-x-4'>
                            <div className='p-3 bg-red-100 rounded-full'>
                                <Clock className='w-6 h-6 text-red-600' />
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Overdue Tasks</p>
                                <p className='text-2xl font-bold text-gray-900'>{userStats.overdueTasks}</p>
                            </div>
                        </Card>
                        <Card className='p-4 flex items-center space-x-4'>
                            <div className='p-3 bg-purple-100 rounded-full'>
                                <Activity className='w-6 h-6 text-purple-600' />
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Total Activity</p>
                                <p className='text-2xl font-bold text-gray-900'>{userStats.activityCount}</p>
                            </div>
                        </Card>
                    </>
                )}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card className='p-6'>
                    <h4 className='text-sm font-bold text-gray-700 uppercase mb-6'>Team Productivity Comparison</h4>
                    <div className='h-64'>
                        <ResponsiveContainer
                            width='100%'
                            height='100%'
                        >
                            <BarChart data={data}>
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    vertical={false}
                                />
                                <XAxis dataKey='userName' />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey='productivityScore'
                                    name='Score'
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className='p-6 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white border-none'>
                    <h4 className='text-sm font-bold text-indigo-200 uppercase mb-4 flex items-center'>
                        <TrendingUp className='w-4 h-4 mr-2' /> AI Improvement Suggestions
                    </h4>
                    <div className='space-y-4'>
                        {insights.map((suggestion, idx) => (
                            <div
                                key={idx}
                                className='flex items-start space-x-3 bg-white/10 p-3 rounded-lg border border-white/10'
                            >
                                <div className='mt-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold'>
                                    {idx + 1}
                                </div>
                                <p className='text-sm text-indigo-50 font-medium'>{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
