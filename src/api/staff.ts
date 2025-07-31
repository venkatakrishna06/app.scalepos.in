// src/api/staff.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {staffService} from '@/lib/api/services/staff.service';
import {StaffMember} from '@/types';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const useStaff = () => {
    return useQuery({
        queryKey: ['staff'],
        queryFn: staffService.getStaff,
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
    });
};

export const useCreateStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (staff: Omit<StaffMember, 'id'>) => staffService.createStaff(staff),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['staff']});
        },
    });
};

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, staff}: { id: number, staff: Partial<StaffMember> }) => staffService.updateStaff(id, staff),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['staff']});
        },
    });
};

export const useDeleteStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => staffService.deleteStaff(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['staff']});
        },
    });
};
