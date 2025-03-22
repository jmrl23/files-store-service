declare interface ListFilesPayload {
  revalidate?: boolean;
  id?: string;
  createdAtFrom?: string | Date;
  createdAtTo?: string | Date;
  skip?: number;
  take?: number;
  order?: 'asc' | 'desc';
  name?: string;
  path?: string;
  mimetype?: string;
  sizeFrom?: number;
  sizeTo?: number;
}
