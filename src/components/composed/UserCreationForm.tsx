import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Loader2, Lock, Mail} from 'lucide-react';
import {toast} from '@/lib/toast';
import {useStaff} from '@/api/staff';
import {useCreateUser, useUpdateUser} from '@/api/users';
import {User} from '@/types';

const userBaseSchema = z.object({
    email: z.string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required'),
    staff_id: z.number().min(1, 'Please select a staff member').optional().nullable(),
    role: z.string().min(1, 'Please select a role'),
});

const newUserSchema = userBaseSchema.extend({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const editUserSchema = userBaseSchema.extend({
    password: z.string()
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .optional()
        .or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const ROLES = [
    {id: 'admin', label: 'Admin'},
    {id: 'manager', label: 'Manager'},
    {id: 'server', label: 'Server'},
    {id: 'kitchen', label: 'Kitchen'},
];

interface UserFormProps {
    initialData?: User;
    onSuccess?: () => void;
}

export default function UserCreationForm({initialData, onSuccess}: UserFormProps) {
    const {data: staff = [], isLoading: staffLoading, isError: staffError} = useStaff();
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isEditMode = !!initialData;
    const schema = isEditMode ? editUserSchema : newUserSchema;

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            email: initialData?.email || '',
            password: '',
            confirmPassword: '',
            staff_id: initialData?.staff_id || undefined,
            role: initialData?.role || '',
        } as z.infer<typeof schema>,
    });

    const selectedStaffId = form.watch('staff_id');

    useEffect(() => {
        if (selectedStaffId && staff.length > 0) {
            const selectedStaff = staff.find(member => member.id === selectedStaffId);
            if (selectedStaff) {
                form.setValue('role', selectedStaff.role.toLowerCase());
            }
        }
    }, [selectedStaffId, staff, form]);

    const handleSubmit = async (data: z.infer<typeof schema>) => {
        try {
            const {confirmPassword, ...payload} = data;

            if (isEditMode && !payload.password) {
                delete payload.password;
            }

            if (isEditMode && initialData) {
                await updateUserMutation.mutateAsync({id: initialData.id, user: payload});
            } else {
                await createUserMutation.mutateAsync(payload as z.infer<typeof newUserSchema>);
            }

            if (onSuccess) {
                onSuccess();
            } else {
                toast.success(`User ${isEditMode ? 'updated' : 'created'} successfully!`);
                form.reset();
            }
        } catch (error: any) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} user. ${error?.message || 'Please try again.'}`);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 dark:text-gray-300">
                                    Email address
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"/>
                                        <Input
                                            placeholder="Enter email"
                                            className="pl-10"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 dark:text-gray-300">
                                        {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"/>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder={isEditMode ? "Enter new password" : "Create a password"}
                                                className="pl-10"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path
                                                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    {!isEditMode && (
                                        <FormDescription className="text-xs">
                                            Password must contain at least 8 characters, including uppercase, lowercase,
                                            number, and special character
                                        </FormDescription>
                                    )}
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 dark:text-gray-300">
                                        {isEditMode ? 'Confirm New Password' : 'Confirm Password'}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"/>
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                className="pl-10"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path
                                                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            User Assignment
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="staff_id"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 dark:text-gray-300">
                                            Select Staff
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                                            value={field.value?.toString() || ''}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select staff member"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {staffLoading ? (
                                                    <div className="flex items-center justify-center p-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400"/>
                                                        <span
                                                            className="ml-2 text-sm text-gray-500">Loading staff...</span>
                                                    </div>
                                                ) : staffError ? (
                                                    <div className="p-2 text-sm text-red-500">Failed to load staff</div>
                                                ) : staff.length === 0 ? (
                                                    <div className="p-2 text-sm text-gray-500">No staff members
                                                        found</div>
                                                ) : (
                                                    staff.map(member => (
                                                        <SelectItem key={member.id} value={member.id.toString()}>
                                                            {member.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 dark:text-gray-300">
                                            Select Role
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select role"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ROLES.map(role => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-6 text-white hover:from-blue-700 hover:to-blue-800"
                    disabled={createUserMutation.isLoading || updateUserMutation.isLoading || staffLoading}
                >
                    {(createUserMutation.isLoading || updateUserMutation.isLoading) ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                            {isEditMode ? 'Updating user...' : 'Creating user...'}
                        </>
                    ) : (
                        isEditMode ? 'Update User' : 'Create User'
                    )}
                </Button>
            </form>
        </Form>
    );
}
