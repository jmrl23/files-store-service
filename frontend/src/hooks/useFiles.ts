import { useApiContext } from '@/contexts/api-context';
import { api } from '@/lib/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export interface UseFilesPayload {
  skip?: number;
  take?: number;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sizeFrom?: number;
  sizeTo?: number;
  mimetype?: string;
  name?: string;
  path?: string;
  order?: string;
}

export function useFiles(payload: UseFilesPayload = {}) {
  const apiContext = useApiContext();
  const queryClient = useQueryClient();
  const queryKey = [
    'api',
    'files',
    payload.skip,
    payload.take,
    payload.createdAtFrom,
    payload.createdAtTo,
    payload.sizeFrom,
    payload.sizeTo,
    payload.mimetype,
    payload.name,
    payload.path,
    payload.order,
  ];
  const data = useQuery({
    queryKey,
    queryFn: () =>
      fetchFiles({
        ...payload,
        apiKey: apiContext.key,
        setKey: apiContext.setKey,
      }),
  });

  return {
    ...data,
    revalidate: async () => {
      await queryClient.invalidateQueries({ queryKey });
      const newData = await fetchFiles({
        ...payload,
        apiKey: apiContext.key,
        revalidate: true,
      });
      await queryClient.setQueryData(queryKey, newData);
    },
  };
}

async function fetchFiles(
  payload: UseFilesPayload & {
    apiKey?: string;
    revalidate?: boolean;
    setKey?: (key: string) => void;
  },
): Promise<FileInfo[]> {
  try {
    const { apiKey, ...params } = payload;
    const response = await api.get<{ data: FileInfo[] }>('/files', {
      headers: { 'X-API-Key': apiKey },
      params,
    });
    const files = response.data.data;
    return files;
  } catch (error) {
    if (error instanceof AxiosError) {
      toast.error(JSON.stringify(error.response?.data, null, 2));
    }
    payload.setKey?.('');
    return [];
  }
}
