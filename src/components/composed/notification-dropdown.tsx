import {useState} from 'react';
import {Bell} from 'lucide-react';
import {formatRelativeTime} from '@/lib/date-utils';
import {Notification} from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {useNavigate} from 'react-router-dom';
import {useClearNotifications, useMarkAllAsRead, useMarkAsRead, useNotifications} from '@/api/notifications';

export function NotificationDropdown() {
    const navigate = useNavigate();
    const {data: notifications = []} = useNotifications();
    const markAsReadMutation = useMarkAsRead();
    const markAllAsReadMutation = useMarkAllAsRead();
    const clearNotificationsMutation = useClearNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;
    const recentNotifications = notifications.slice(0, 10);

    const handleNotificationClick = (notification: Notification) => {
        markAsReadMutation.mutate(notification.id);

        switch (notification.type) {
            case 'table_update':
                navigate('/tables');
                break;
            case 'order_update':
            case 'order_item_status_update':
                navigate(`/orders?id=${notification.entityId}`);
                break;
            case 'menu_item_update':
                navigate('/menu');
                break;
        }

        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5"/>
                    {unreadCount > 0 && (
                        <span
                            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center p-2">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => markAllAsReadMutation.mutate()}
                                disabled={unreadCount === 0}>
                            Mark all read
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => clearNotificationsMutation.mutate()}
                                disabled={notifications.length === 0}>
                            Clear all
                        </Button>
                    </div>
                </div>
                <DropdownMenuSeparator/>

                {recentNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    recentNotifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className={`p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex flex-col gap-1 w-full">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium">{notification.message}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatRelativeTime(notification.timestamp)}
                                    </span>
                                </div>
                                {notification.details && (
                                    <span className="text-sm text-muted-foreground">{notification.details}</span>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
