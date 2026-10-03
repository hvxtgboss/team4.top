import client from './client';

export const uploadFile = async (
  courseId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await client.post(`/courses/${courseId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data.file_id;
};

export const getProcessingStatus = async (fileId: string) => {
  const response = await client.get(`/upload/${fileId}/status`);
  return response.data;
};

export const cancelUpload = async (fileId: string): Promise<void> => {
  await client.post(`/upload/${fileId}/cancel`);
};
