import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {Button} from '@/components/ui/button';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Building2, CreditCard, Loader2, Lock, Mail, MapPin, Phone} from 'lucide-react';
import {toast} from '@/lib/toast';

const signupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  restaurant_name: z.string()
    .min(2, 'Restaurant name must be at least 2 characters')
    .max(50, 'Restaurant name cannot exceed 50 characters'),
  restaurant_address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .optional(),
  restaurant_phone: z.string()
    .regex(/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number')
    .optional(),
  restaurant_email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  restaurant_gst: z.string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Please enter a valid GST number (15 characters)')
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      restaurant_name: '',
      restaurant_address: '',
      restaurant_phone: '',
      restaurant_email: '',
      restaurant_gst: '',
    },
  });

  const handleSubmit = async (data: SignupFormData) => {
    try {

      await signup(
        data.email,
        data.password,
        data.restaurant_name,
        data.restaurant_address,
        data.restaurant_phone,
        data.restaurant_email,
        data.restaurant_gst
      );
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (error) {
        toast.error(error);
        clearError();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-2xl space-y-8 rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:bg-gray-800/80">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Set up your restaurant management system
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">
                          Email address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              placeholder="Enter your email"
                              className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restaurant_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">
                          Restaurant Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              placeholder="Enter restaurant name"
                              className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Password must contain at least 8 characters, including uppercase, lowercase, number, and special character
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Restaurant Details
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="restaurant_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            Restaurant Phone
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="Enter phone number"
                                className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restaurant_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            Restaurant Email (Optional)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="Enter restaurant email"
                                className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="restaurant_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            Restaurant Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="Enter restaurant address"
                                className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restaurant_gst"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            GST Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="Enter GST number (15 characters)"
                                className="pl-10 dark:border-blue-700 dark:focus:border-blue-500"
                                maxLength={15}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Format: 2 digits state code, 10 digits PAN number, followed by 3 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-6 text-white hover:from-blue-700 hover:to-blue-800"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign in instead
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
