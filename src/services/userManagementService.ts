import axios from 'axios';

type CreateUserPayload = {
  email: string;
  password: string;
  staff_id: string;
  role: string;
};

type Staff = {
  id: string;
  name: string;
};

/**
 * Fetch list of available staff members
 */
export const fetchStaffList = async (): Promise<Staff[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/staff`);
    return response.data;
  } catch (error) {
    console.error('Error fetching staff list:', error);
    throw error;
  }
};

/**
 * Create a new user account
 */
export const createUserAccount = async (userData: CreateUserPayload): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
};
