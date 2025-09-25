import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useApiContext } from '@/contexts/api-context';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  apiKey: z.string().min(1, { message: 'Must have at least 1 character' }),
});

function AuthView() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: '',
    },
  });
  const apiContext = useApiContext();

  function onSubmit(values: z.infer<typeof formSchema>) {
    apiContext.setKey(values.apiKey);
  }

  return (
    <div className='h-screen p-4 flex items-center'>
      <div className='w-full'>
        <div className='max-w-[500px] mx-auto'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='p-4 bg-white shadow rounded-xl'
            >
              <h1 className='font-extrabold text-3xl'>Authorization</h1>
              <p className='text-xs mb-4 text-slate-500 font-bold'>
                API Key to access resources
              </p>
              <div className='grid grid-cols-1 gap-2'>
                <FormField
                  name='apiKey'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete='off'
                          type='password'
                          autoFocus
                        />
                      </FormControl>
                      <FormDescription />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='flex justify-end'>
                  <Button type='submit' title='Submit'>
                    Submit
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default AuthView;
