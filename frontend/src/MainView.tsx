import { FilesTable } from '@/components/main-view/files-table';
import { PayloadForm } from '@/components/main-view/payload-form';
import { Separator } from '@/components/ui/separator';
import { useFiles, UseFilesPayload } from '@/hooks/useFiles';
import { useState } from 'react';

const now = new Date();
now.setHours(23);
now.setMinutes(59);
now.setSeconds(59);

function Main() {
  const [payload, setPayload] = useState<UseFilesPayload>({
    skip: 0,
    take: 20,
    sizeFrom: 0,
    sizeTo: 500_000_000,
    order: 'desc',
    name: undefined,
    path: undefined,
    createdAtFrom: new Date(0),
    createdAtTo: now,
  });
  const { data: files, isLoading, revalidate } = useFiles(payload);

  return (
    <main>
      <PayloadForm
        values={payload}
        setValues={setPayload}
        revalidate={revalidate}
        isLoading={isLoading}
      />
      <Separator orientation='horizontal' />
      <FilesTable files={files} revalidate={revalidate} />
    </main>
  );
}

export default Main;
