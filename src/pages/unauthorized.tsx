import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="mt-2 text-muted-foreground">
        You don't have permission to access this page.
      </p>
      <Button className="mt-4" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </div>
  );
}