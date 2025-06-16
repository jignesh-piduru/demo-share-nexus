import { BASE_URL } from './apiConfig';
import { DemoSession, ApiError, ApiErrorResponse } from '../types/api';

interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

// Demo Session API functions
export const sessionApi = {
  // Fetch all sessions with optional pagination
  getAll: async (page?: number, limit?: number): Promise<DemoSession[] | PaginatedResponse<DemoSession>> => {
    let url = `${BASE_URL}/api/sessions`;
    
    // Add pagination parameters if provided
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    return response.json();
  },

  // Fetch session by ID
  get: async (id: string): Promise<DemoSession> => {
    const response = await fetch(`${BASE_URL}/api/sessions/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }
    return response.json();
  },

  // Create new session
  create: async (sessionData: Omit<DemoSession, 'id'>): Promise<DemoSession> => {
    const response = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    return response.json();
  },

  // Update session by ID
  update: async (id: string, sessionData: Partial<DemoSession>): Promise<DemoSession> => {
    console.log('=== Update Session Debug ===');
    console.log('Session ID:', id);
    console.log('Original session data:', sessionData);
    
    // Create properly typed object for the update
    const cleanedData: Partial<DemoSession> & { id: string } = {
      id: id,
      // Include all required fields
      title: sessionData.title,
      technology: sessionData.technology,
      date: sessionData.date,
      time: sessionData.time,
      description: sessionData.description,
      createdBy: sessionData.createdBy,
      attendees: sessionData.attendees,
      maxAttendees: sessionData.maxAttendees,
      status: sessionData.status,
      location: sessionData.location,
      difficulty: sessionData.difficulty,
      type: sessionData.type
    };

    // Add optional fields if they are present
    Object.entries(sessionData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Convert values to the correct type based on the field
        switch (key) {
          case 'attendees':
          case 'maxAttendees':
          case 'duration':
          case 'storyPoints':
          case 'numberOfTasks':
          case 'numberOfBugs':
          case 'rating':
            (cleanedData as any)[key] = Number(value);
            break;
          case 'status':
            (cleanedData as any)[key] = value as 'upcoming' | 'completed' | 'cancelled';
            break;
          case 'difficulty':
            (cleanedData as any)[key] = value as 'Beginner' | 'Intermediate' | 'Advanced';
            break;
          case 'type':
            (cleanedData as any)[key] = value as 'PROJECT_BASED' | 'PRODUCT_BASED';
            break;
          case 'currentStatus':
            // Convert frontend format to backend format
            const convertToBackendFormat = (status: string): string => {
              switch (status) {
                case 'In Progress':
                  return 'In_Progress';
                case 'On Hold':
                  return 'On_Hold';
                default:
                  return status;
              }
            };
            (cleanedData as any)[key] = convertToBackendFormat(value as string);
            break;
          case 'sprintName':
          case 'feedback':
          case 'prerequisites':
            (cleanedData as any)[key] = value || '';
            break;
          default:
            (cleanedData as any)[key] = value;
        }
      }
    });

    console.log('Final update payload:', cleanedData);
    
    try {
      const response = await fetch(`${BASE_URL}/api/sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiErrorResponse;
        console.error('Error response:', errorData);
        const error = new Error('Failed to update session') as ApiError;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      const responseData = await response.json();
      console.log('Success response:', responseData);

      // Convert backend format to frontend format for currentStatus
      if (responseData.currentStatus) {
        const convertToFrontendFormat = (status: string): string => {
          switch (status) {
            case 'In_Progress':
              return 'In Progress';
            case 'On_Hold':
              return 'On Hold';
            default:
              return status;
          }
        };
        responseData.currentStatus = convertToFrontendFormat(responseData.currentStatus);
      }

      return responseData;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  },

  // Delete session by ID
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/api/sessions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete session');
    }
  },
};
