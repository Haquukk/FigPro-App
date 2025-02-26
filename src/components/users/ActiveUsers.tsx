import { useMemo } from "react";
import { generateRandomName } from "@/lib/utils";
import {
  useOthers,
  useSelf,
} from "../../../liveblocks.config";
import AvatarUsers from "./AvatarUsers";

const ActiveUsers = () => {
  const others = useOthers();
  const currentUser = useSelf();

  const memoizedUsers = useMemo(() => {
    const hasMoreUsers = others.length > 2;
    return (
      <div className='flex items-center justify-center gap-1'>
        {currentUser && <AvatarUsers name='You' />}

        {others.slice(0, 2).map(({ connectionId }) => (
          <AvatarUsers
            otherStyles='-ml-3'
            key={connectionId}
            name={generateRandomName()}
          />
        ))}

        {hasMoreUsers && (
          <div className='bg-primary-black z-10 -ml-3 flex h-9 w-9 items-center justify-center rounded-full'>
            +{others.length - 2}
          </div>
        )}
      </div>
    );
  }, [others.length]);

  return memoizedUsers;
};

export default ActiveUsers;
