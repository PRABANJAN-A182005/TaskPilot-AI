import { AgentConfig } from './types';
import { z } from 'zod';

export const AGENT_CONFIGS: AgentConfig[] = [
    {
        id: '6a7f791a-7a16-4981-aa59-67444db75f26',
        name: 'TaskPilot AI Assistant',
        description:
            'An expert project manager and productivity strategist to transform vague project goals into actionable plans.',
        triggerEvents: [
            {
                name: 'task_description_input',
                description:
                    'When a user saves or updates a task description, the agent analyzes the text to generate subtasks, priority, and strategy.',
                type: 'sync',
                outputSchema: z.object({
                    subtasks: z.array(z.string()),
                    suggested_priority: z.enum(['High', 'Medium', 'Low']),
                    strategy_summary: z.string()
                })
            },
            {
                name: 'project_milestone_check',
                description:
                    'When a project reaches a specific progress percentage, the agent reviews remaining tasks and suggests an updated execution strategy.',
                type: 'async'
            },
            {
                name: 'deadline_proximity_alert',
                description:
                    "When a task deadline is within 24 hours and the status is not 'Complete', the agent re-evaluates the task priority and provides a 'Quick-Win' summary to expedite completion.",
                type: 'async'
            }
        ],
        config: {
            appId: '26ea6f46-2f49-4772-a99e-e94bc2787058',
            accountId: '8af3be52-36b2-46b9-8c9c-e71a72bf6f83',
            widgetKey: '4Y0XjmaqjAUKZOaMWnoI1xmjO48r4puv7bksKkbT'
        }
    }
];
