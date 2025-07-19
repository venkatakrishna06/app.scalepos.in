import React from 'react';
// ...existing code...
import PeopleIcon from '@mui/icons-material/People';

const Sidebar = () => {
    // ...existing code...

    return (
        <div className="sidebar">
            {/* ...existing code... */}

            {/* Only show to users with admin role */}
            {userRole === 'admin' && (
                <ListItem
                    button
                    component={Link}
                    to="/user-management"
                    className={location.pathname === '/user-management' ? 'active' : ''}
                >
                    <ListItemIcon>
                        <PeopleIcon/>
                    </ListItemIcon>
                    <ListItemText primary="User Management"/>
                </ListItem>
            )}

            {/* ...existing code... */}
        </div>
    );
};

export default Sidebar;
