# Custom Hooks

This directory contains custom hooks that can be used throughout the application.

## useApi

The `useApi` hook provides a consistent way to handle API calls with loading states, error handling, and toast messages.

### Example Usage

```tsx
import { useApi } from '@/hooks/useApi';
import { userService } from '@/lib/api/services/user.service';

function UserProfile({ userId }: { userId: number }) {
  const {
    loading,
    error,
    data: user,
    execute: fetchUser
  } = useApi(
    userService.getUser,
    {
      errorMessage: 'Failed to load user profile',
      showErrorToast: true
    }
  );

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading user profile</div>;
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### With Form Submission

```tsx
import { useApi } from '@/hooks/useApi';
import { userService } from '@/lib/api/services/user.service';

function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const {
    loading,
    execute: createUser
  } = useApi(
    userService.createUser,
    {
      successMessage: 'User created successfully',
      errorMessage: 'Failed to create user',
      showSuccessToast: true,
      showErrorToast: true,
      onSuccess: () => {
        // Reset form
        setName('');
        setEmail('');
      }
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({ name, email });
    } catch (error) {
      // Error is already handled by the hook
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Benefits

- Consistent loading and error states
- Automatic toast messages for success and error cases
- Reduced boilerplate code in components
- Type-safe API calls
- Centralized error handling