import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

type Props = {
  name: string;
  otherStyles?: string;
};

const AvatarUsers = ({ name, otherStyles }: Props) => {
  return (
    <>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`group relative h-9 w-9 rounded-full border-2 border-white ${otherStyles}`}
            data-tooltip={name}
          >
            <Avatar className='h-full w-full'>
              <AvatarImage
                src='https://github.com/shadcn.png'
                alt='@shadcn'
                className='transition-opacity duration-300 group-hover:opacity-50'
              />
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
          </div>
        </TooltipTrigger>
        <TooltipContent className='bg-primary-grey-200 border-none px-2.5 py-1.5 text-xs'>
          {name}
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default AvatarUsers;
