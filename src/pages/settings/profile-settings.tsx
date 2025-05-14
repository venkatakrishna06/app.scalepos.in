import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import Profile from '@/pages/profile';

export default function ProfileSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Profile />
      </CardContent>
    </Card>
  );
}