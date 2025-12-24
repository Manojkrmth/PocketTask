
'use server';

import { supabase } from '@/lib/supabase';
import type { AppTask } from '@/types/task';

export const updateTaskStatus = async (task: AppTask, status: 'Approved' | 'Rejected', reason?: string) => {
    const existingMetadata = task.submission_data?.metadata || {};
    const updatePayload: { status: 'Approved' | 'Rejected'; submission_data?: any } = { status };
    
    let newMetadata = {...existingMetadata};
    if (status === 'Rejected' && reason) {
        newMetadata.rejection_reason = reason;
    }
    if (status === 'Approved' && reason) {
        newMetadata.approval_note = reason;
    }

    updatePayload.submission_data = { ...task.submission_data, metadata: newMetadata };

    const { error: updateError } = await supabase
        .from('usertasks')
        .update(updatePayload)
        .eq('id', task.id);

    if (updateError) throw updateError;
    
    if (status === 'Approved' && task.reward > 0) {
        const { error: walletError } = await supabase
            .from('wallet_history')
            .insert({
                user_id: task.user_id,
                amount: task.reward,
                type: 'task_reward',
                status: 'Completed',
                description: `Reward for task: ${task.task_type}`
            });
        
        if (walletError) throw walletError;
    }
}
