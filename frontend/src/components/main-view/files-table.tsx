import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useApiContext } from '@/contexts/api-context';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import {
  ClipboardCopyIcon,
  DownloadIcon,
  LinkIcon,
  TrashIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

interface FilesTableProps {
  files?: FileInfo[];
  revalidate(): Promise<void>;
}

export function FilesTable(props: FilesTableProps) {
  const [, copy] = useCopyToClipboard();
  const apiContext = useApiContext();

  return (
    <Table className='p-16'>
      <TableCaption>List of uploaded files.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead> ID </TableHead>
          <TableHead> Date created </TableHead>
          <TableHead> Name </TableHead>
          <TableHead> Path </TableHead>
          <TableHead> Size </TableHead>
          <TableHead> Action </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.files?.map((file) => {
          const url = new URL(
            `/files/${file.path === '' ? '' : file.path + '/'}${file.name}`,
            import.meta.env.DEV
              ? 'http://localhost:3001'
              : window.location.origin,
          ).toString();

          return (
            <TableRow key={file.id}>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      title='Copy id'
                      variant={'outline'}
                      onClick={() => {
                        copy(file.id).then(() => toast.success('Id copied'));
                      }}
                    >
                      <ClipboardCopyIcon />
                      Copy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{file.id}</TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>{format(file.createdAt, 'yyyy-MM-dd')}</TableCell>
              <TableCell>{file.name}</TableCell>
              <TableCell>{file.path || '<default_path>'}</TableCell>
              <TableCell>{file.size}</TableCell>
              <TableCell className='flex gap-2'>
                <Button
                  variant={'outline'}
                  type='button'
                  title='Copy file link'
                  onClick={() =>
                    copy(url).then(() => toast.success('Link copied'))
                  }
                >
                  <LinkIcon />
                  <span className='hidden lg:inline'>Link</span>
                </Button>
                <Button
                  variant={'outline'}
                  type='button'
                  title='Download file'
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <DownloadIcon />
                  <span className='hidden lg:inline'>Download</span>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant={'outline'}
                      type='button'
                      title='Delete file'
                    >
                      <TrashIcon />
                      <span className='hidden lg:inline'>Delete</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete confirmation</DialogTitle>
                      <DialogDescription>
                        Remove file permanently
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          type='button'
                          title='Cancel'
                          variant={'outline'}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          type='button'
                          title='Delete'
                          variant={'destructive'}
                          onClick={async () => {
                            toast.promise(
                              api.delete(`/files/delete/${file.id}`, {
                                headers: {
                                  'X-Api-Key': apiContext.key,
                                },
                              }),
                              {
                                loading: `Deleting file: ${file.id}`,
                                async success() {
                                  await props.revalidate();
                                  return <p>Deleted successfully</p>;
                                },
                                error(error) {
                                  if (error instanceof AxiosError) {
                                    return JSON.stringify(error.response?.data);
                                  }
                                  return 'An error occurs';
                                },
                              },
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
