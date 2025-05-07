import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurant_name, setRestaurantName] = useState('');
  const [restaurant_address, setRestaurantAddress] = useState('');
  const [restaurant_phone, setRestaurantPhone] = useState('');
  const [restaurant_email, setRestaurantEmail] = useState('');
  const [restaurant_description, setRestaurantDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(
        email, 
        password, 
        restaurant_name,
        restaurant_address,
        restaurant_phone,
        restaurant_email,
        restaurant_description
      );
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>

            <div>
              <label htmlFor="restaurant_name" className="sr-only">
                Restaurant Name
              </label>
              <input
                id="restaurant_name"
                name="restaurant_name"
                type="text"
                required
                value={restaurant_name}
                onChange={(e) => {
                  setRestaurantName(e.target.value);
                  clearError();
                }}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Restaurant Name"
              />
            </div>

            <div>
              <label htmlFor="restaurant_address" className="sr-only">
                Restaurant Address
              </label>
              <input
                id="restaurant_address"
                name="restaurant_address"
                type="text"
                value={restaurant_address}
                onChange={(e) => {
                  setRestaurantAddress(e.target.value);
                  clearError();
                }}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Restaurant Address"
              />
            </div>

            <div>
              <label htmlFor="restaurant_phone" className="sr-only">
                Restaurant Phone
              </label>
              <input
                id="restaurant_phone"
                name="restaurant_phone"
                type="text"
                value={restaurant_phone}
                onChange={(e) => {
                  setRestaurantPhone(e.target.value);
                  clearError();
                }}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Restaurant Phone"
              />
            </div>

            <div>
              <label htmlFor="restaurant_email" className="sr-only">
                Restaurant Email
              </label>
              <input
                id="restaurant_email"
                name="restaurant_email"
                type="email"
                value={restaurant_email}
                onChange={(e) => {
                  setRestaurantEmail(e.target.value);
                  clearError();
                }}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Restaurant Email"
              />
            </div>

            <div>
              <label htmlFor="restaurant_description" className="sr-only">
                Restaurant Description
              </label>
              <textarea
                id="restaurant_description"
                name="restaurant_description"
                value={restaurant_description}
                onChange={(e) => {
                  setRestaurantDescription(e.target.value);
                  clearError();
                }}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Restaurant Description"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sign up
            </Button>
          </div>

          <div className="text-center text-sm">
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
