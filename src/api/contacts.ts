import { apiClient } from './client';

export interface ContactInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: 'COACH' | 'ADMIN';
  groups?: { id: string; name: string }[];
}

export interface ContactsResponse {
  coaches: ContactInfo[];
  admins: ContactInfo[];
  myCoachIds: string[];
}

export const contactsApi = {
  getContacts: async (): Promise<ContactsResponse> => {
    const response = await apiClient.get<ContactsResponse>('/contacts');
    return response.data;
  },
};
