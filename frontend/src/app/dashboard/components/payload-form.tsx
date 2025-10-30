import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DateTimePicker } from '@/components/ui/datetime-picker';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useApiContext } from '@/contexts/api-context';
import { api } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  FilterIcon,
  LogOutIcon,
  RotateCwIcon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react';
import mimedb from 'mime-db';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  skip: z.number().int().optional(),
  take: z.number().int().optional(),
  createdAtFrom: z.date().optional(),
  createdAtTo: z.date().optional(),
  sizeFrom: z.number().int().optional(),
  sizeTo: z.number().int().optional(),
  mimetype: z.string().optional(),
  name: z.string().optional(),
  path: z.string().optional(),
  revalidate: z.boolean().optional(),
  order: z.string().optional(),
});

export interface PayloadFormProps {
  values: z.infer<typeof formSchema>;
  setValues(values: z.infer<typeof formSchema>): void;
  revalidate(): Promise<void>;
  isLoading: boolean;
}

const mimetypes = Object.keys(mimedb).map((key) => ({
  label: key,
  value: key,
}));

export function PayloadForm(props: PayloadFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: props.values,
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isIgnorePath) {
      values.path = undefined;
    }
    props.setValues(values);
  }

  const [isMimetypeOpen, setIsMimetypeOpen] = useState(false);
  const [isIgnorePath, setIsIgnorePath] = useState<boolean>(true);
  const apiContext = useApiContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPathRef = useRef<HTMLInputElement>(null);
  async function uploadFiles() {
    const formData = new FormData();
    const files = fileInputRef.current?.files;

    const filePath = uploadPathRef.current?.value.trim();
    if (filePath) {
      formData.append('path', filePath);
    }

    if (!files || files.length < 1) {
      toast.error('No file attached');
      return;
    }

    for (const file of files) {
      formData.append('files', file);
    }

    toast.promise(
      api.post<{ data: FileInfo[] }>('/files/upload', formData, {
        headers: {
          'X-API-Key': apiContext.key,
        },
      }),
      {
        loading: 'Uploading',
        async success(response) {
          await props.revalidate();
          const files = response.data.data;
          return (
            <div>
              {files.length > 1 ? (
                <p>Uploaded {files.length} files</p>
              ) : (
                <p>Uploaded {files.length} file</p>
              )}
            </div>
          );
        },
        error(error) {
          if (error instanceof AxiosError) {
            return <pre>{JSON.stringify(error.response?.data, null, 2)}</pre>;
          }
          return 'An unexpected error occurred.';
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='p-4'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <div className='grid grid-cols-2 items-start'>
            <FormField
              name='skip'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skip</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete='off'
                      className='rounded-r-none'
                      type='number'
                      inputMode='decimal'
                      onChange={(e) => {
                        if (
                          e.target.value.length > 1 &&
                          e.target.value.startsWith('0')
                        ) {
                          e.target.value = e.target.value.substring(1);
                        }
                        const value = parseInt(e.target.value ?? '0', 10);
                        if (Number.isNaN(value)) return field.onChange(0);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='take'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Take</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete='off'
                      className='rounded-l-none'
                      type='number'
                      inputMode='decimal'
                      onChange={(e) => {
                        if (
                          e.target.value.length > 1 &&
                          e.target.value.startsWith('0')
                        ) {
                          e.target.value = e.target.value.substring(1);
                        }
                        const value = parseInt(e.target.value ?? '0', 10);
                        if (Number.isNaN(value)) return field.onChange(0);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid grid-cols-2 items-start'>
            <FormField
              name='sizeFrom'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Size (B)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete='off'
                      className='rounded-r-none'
                      type='number'
                      inputMode='decimal'
                      onChange={(e) => {
                        if (
                          e.target.value.length > 1 &&
                          e.target.value.startsWith('0')
                        ) {
                          e.target.value = e.target.value.substring(1);
                        }
                        const value = parseInt(e.target.value ?? '0', 10);
                        if (Number.isNaN(value)) return field.onChange(0);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='sizeTo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Size (B)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete='off'
                      className='rounded-l-none'
                      type='number'
                      inputMode='decimal'
                      onChange={(e) => {
                        if (
                          e.target.value.length > 1 &&
                          e.target.value.startsWith('0')
                        ) {
                          e.target.value = e.target.value.substring(1);
                        }
                        const value = parseInt(e.target.value ?? '0', 10);
                        if (Number.isNaN(value)) return field.onChange(0);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid grid-cols-2 items-start'>
            <FormField
              name='path'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Path</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isIgnorePath}
                      autoComplete='off'
                      className='rounded-r-none'
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='order'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className='w-full rounded-l-none'>
                        <SelectValue placeholder='Select order' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='asc'>Ascending</SelectItem>
                        <SelectItem value='desc'>Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid grid-cols-2 items-start'>
            <FormField
              name='createdAtFrom'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date from</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      classNames={{ trigger: 'rounded-r-none' }}
                      value={field.value}
                      onChange={(value) => {
                        if (value) {
                          value.setHours(0);
                          value.setMinutes(0);
                          value.setSeconds(0);
                          field.onChange(value);
                        }
                      }}
                      hideTime
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='createdAtTo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date to</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      classNames={{ trigger: 'rounded-l-none' }}
                      value={field.value}
                      onChange={(value) => {
                        if (value) {
                          value.setHours(23);
                          value.setMinutes(59);
                          value.setSeconds(59);
                          field.onChange(value);
                        }
                      }}
                      hideTime
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid grid-cols-2 items-start'>
            <FormField
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filename</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete='off'
                      className='rounded-r-none'
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value =
                          e.target.value.length < 1
                            ? undefined
                            : e.target.value;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='mimetype'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select mimetype</FormLabel>
                  <FormControl>
                    <Popover
                      open={isMimetypeOpen}
                      onOpenChange={setIsMimetypeOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          role='combobox'
                          aria-expanded={isMimetypeOpen}
                          className='justify-between rounded-l-none truncate'
                        >
                          {field.value
                            ? mimetypes.find(
                                (mimetype) => mimetype.value === field.value,
                              )?.label
                            : 'Select mimetype...'}
                          <ChevronsUpDownIcon className='opacity-50' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-[200px] p-0'>
                        <Command>
                          <CommandInput placeholder='Search mimetype...' />
                          <CommandList>
                            <CommandEmpty>No mimetype found.</CommandEmpty>
                            <CommandGroup>
                              {mimetypes.map((mimetype) => (
                                <CommandItem
                                  key={mimetype.value}
                                  value={mimetype.value}
                                  onSelect={(currentValue) => {
                                    field.onChange(
                                      currentValue === field.value
                                        ? undefined
                                        : currentValue,
                                    );
                                    setIsMimetypeOpen(false);
                                  }}
                                >
                                  {mimetype.label}
                                  <CheckIcon
                                    className={cn(
                                      'ml-auto',
                                      mimetype === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className='flex gap-4 justify-end mt-4'>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='ignore-path'
              onClick={() => setIsIgnorePath((value) => !value)}
              checked={isIgnorePath}
            />
            <label
              htmlFor='ignore-path'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Ignore path
            </label>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button type='button' variant={'outline'} title='Upload files'>
                <UploadCloudIcon />
                <span className='hidden lg:inline'>Upload</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload files</DialogTitle>
                <DialogDescription>
                  Select single or multiple files to upload
                </DialogDescription>
              </DialogHeader>
              <Input type='file' multiple ref={fileInputRef} />

              <FormField
                name='filePath'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type='text'
                        autoComplete='off'
                        ref={uploadPathRef}
                      />
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type='button' variant={'outline'} title='Close'>
                    <XIcon />
                    Close
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type='button' title='Upload' onClick={uploadFiles}>
                    <UploadCloudIcon />
                    Upload
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            type='button'
            variant={'outline'}
            title='Revalidate entries'
            onClick={props.revalidate}
          >
            <RotateCwIcon className={cn(props.isLoading ?? 'animate-spin')} />
            <span className='hidden lg:inline'>Revalidate</span>
          </Button>
          <Button type='submit' title='Filter/ Fetch files'>
            <FilterIcon />
            <span className='hidden lg:inline'>Filter</span>
          </Button>
          <div className='flex gap-4'>
            <Separator orientation='vertical' />
            <Button
              type='button'
              variant={'secondary'}
              title='Logout'
              onClick={() => apiContext.setKey('')}
            >
              <LogOutIcon />
              <span className='hidden lg:inline'>Logout</span>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
