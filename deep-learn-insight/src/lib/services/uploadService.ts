import apiClient from '../apiClient';

export interface UploadLimits {
  maxFileSizeMb: number;
  allowedExtensions: string[];
}

export const uploadService = {
  getLimits: () =>
    apiClient.get<UploadLimits>('/api/uploads/limits'),
};

export default uploadService;
