import { LiveMap } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import { RoomProvider } from "../liveblocks.config";

const Loader = () => {
  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center gap-2'>
      <img
        src='/assets/loader.gif'
        alt='loader'
        width={100}
        height={100}
        className='object-contain'
      />
      <p className='text-primary-grey-300 text-sm font-bold'>
        Loading...
      </p>
    </div>
  );
};

const Room = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <RoomProvider
      id='fig-room'
      initialPresence={{
        cursor: null,
        cursorColor: null,
        editingText: null,
      }}
      initialStorage={{
        canvasObjects: new LiveMap(),
      }}
    >
      <ClientSideSuspense fallback={<Loader />}>
        {() => children}
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default Room;
