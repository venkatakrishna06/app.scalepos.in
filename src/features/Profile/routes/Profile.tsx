import {AlertCircle, Camera, Key, Loader2, Mail, Phone, Save, User as UserIcon, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {useProfilePage} from '@/hooks/useProfilePage';

export default function Profile() {
    const {
        user,
        loading,
        error,
        showPasswordDialog,
        passwordError,
        isEditing,
        formData,
        activeTab,
        dispatch,
        updateProfileMutation,
        changePasswordMutation,
        handleProfileUpdate,
        handlePasswordChange,
        cancelEdit,
        initAuth,
    } = useProfilePage();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <span className="text-lg text-muted-foreground">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (!user && !loading) {
        return (
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl text-destructive">Unable to load profile</CardTitle>
                    <CardDescription>There was a problem loading your profile information.</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => initAuth()}>
                        <AlertCircle className="mr-2 h-4 w-4"/>
                        Retry
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div>
            <Tabs
                value={activeTab}
                onValueChange={(payload) => dispatch({type: 'SET_ACTIVE_TAB', payload})}
                className="w-full"
            >
                <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Personal Information</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                        <div className="relative">
                            <div
                                className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-primary/10">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.staff.name}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <UserIcon className="h-12 w-12 text-muted-foreground"/>
                                )}
                            </div>
                            <button
                                className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                                aria-label="Change profile picture"
                            >
                                <Camera className="h-4 w-4"/>
                            </button>
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-foreground">{user?.staff.name}</h2>
                            <p className="text-muted-foreground">{user?.role}</p>
                            {!isEditing && (
                                <Button
                                    onClick={() => dispatch({type: 'SET_IS_EDITING', payload: true})}
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            dispatch({type: 'SET_FORM_DATA', payload: {name: e.target.value}})
                                        }
                                        disabled={!isEditing}
                                        className="pl-10"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            dispatch({type: 'SET_FORM_DATA', payload: {email: e.target.value}})
                                        }
                                        disabled={!isEditing}
                                        className="pl-10"
                                        placeholder="Your email address"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium">
                                    Phone Number
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            dispatch({type: 'SET_FORM_DATA', payload: {phone: e.target.value}})
                                        }
                                        disabled={!isEditing}
                                        className="pl-10"
                                        placeholder="Your phone number"
                                    />
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={cancelEdit}>
                                    <X className="mr-2 h-4 w-4"/>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={updateProfileMutation.isLoading}>
                                    {updateProfileMutation.isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    ) : (
                                        <Save className="mr-2 h-4 w-4"/>
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </form>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>
                                Change your password to keep your account secure
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button
                                variant="outline"
                                onClick={() => dispatch({type: 'SET_SHOW_PASSWORD_DIALOG', payload: true})}
                                className="flex items-center gap-2"
                            >
                                <Key className="h-4 w-4"/>
                                Change Password
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="outline" disabled>
                                Coming Soon
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Login Sessions</CardTitle>
                            <CardDescription>
                                Manage your active sessions and devices
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="outline" disabled>
                                Coming Soon
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog
                open={showPasswordDialog}
                onOpenChange={(payload) => dispatch({type: 'SET_SHOW_PASSWORD_DIALOG', payload})}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handlePasswordChange} className="space-y-4 py-3">
                        {(error || passwordError) && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription>{error || passwordError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                onChange={(e) =>
                                    dispatch({type: 'SET_CURRENT_PASSWORD', payload: e.target.value})
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                onChange={(e) =>
                                    dispatch({type: 'SET_NEW_PASSWORD', payload: e.target.value})
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                onChange={(e) =>
                                    dispatch({type: 'SET_CONFIRM_PASSWORD', payload: e.target.value})
                                }
                                required
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => dispatch({type: 'RESET_PASSWORD_FORM'})}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={changePasswordMutation.isLoading}>
                                {changePasswordMutation.isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                )}
                                Update Password
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
