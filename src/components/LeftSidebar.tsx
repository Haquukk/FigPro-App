import { useMemo } from "react";
import { getShapeInfo } from "@/lib/utils";

const LeftSidebar = ({
  allShapes,
}: {
  allShapes: Array<any>;
}) => {
  // memoize the result of this function so that it doesn't change on every render but only when there are new shapes
  const memoizedShapes = useMemo(
    () => (
      <section className='border-primary-grey-200 bg-primary-black text-primary-grey-300 sticky left-0 flex h-full min-w-[227px] flex-col overflow-y-auto border-t pb-20 select-none max-sm:hidden'>
        <h3 className='border-primary-grey-200 border px-5 py-4 text-xs uppercase'>
          Layers
        </h3>
        <div className='flex flex-col'>
          {allShapes?.map((shape: any) => {
            const info = getShapeInfo(shape[1]?.type);

            return (
              <div
                key={shape[1]?.objectId}
                className='group hover:bg-primary-green hover:text-primary-black my-1 flex items-center gap-2 px-5 py-2.5 hover:cursor-pointer'
              >
                <img
                  src={info?.icon}
                  alt='Layer'
                  width={16}
                  height={16}
                  className='group-hover:invert'
                />
                <h3 className='text-sm font-semibold capitalize'>
                  {info.name}
                </h3>
              </div>
            );
          })}
        </div>
      </section>
    ),
    [allShapes?.length]
  );

  return memoizedShapes;
};

export default LeftSidebar;
