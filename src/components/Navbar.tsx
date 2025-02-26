import { ActiveElement, NavbarProps } from "@/types/type";
import ActiveUsers from "./users/ActiveUsers";
import { memo } from "react";
import { navElements } from "@/constants";

import { Button } from "./ui/button";
import ShapesMenu from "./ShapeMenu";
import { NewThread } from "./comment/NewThread";

const Navbar = ({
  activeElement,
  imageInputRef,
  handleActiveElement,
  handleImageUpload,
}: NavbarProps) => {
  const isActive = (value: string | Array<ActiveElement>) =>
    (activeElement && activeElement.value === value) ||
    (Array.isArray(value) &&
      value.some(
        (val) => val?.value === activeElement?.value
      ));

  return (
    <nav className='bg-primary-black flex items-center justify-between gap-4 px-5 text-white select-none'>
      <img
        src='/assets/logo.svg'
        alt='figPro logo'
        width={58}
        height={20}
      />
      <ul className='flex flex-row'>
        {navElements.map((item: ActiveElement | any) => (
          <li
            key={item.name}
            onClick={() => {
              if (Array.isArray(item.value)) return;
              handleActiveElement(item);
            }}
            className={`group flex items-center justify-center px-2.5 py-5 ${isActive(item.value) ? "bg-primary-green" : "hover:bg-primary-grey-200"} `}
          >
            {Array.isArray(item.value) ? (
              <ShapesMenu
                item={item}
                activeElement={activeElement}
                imageInputRef={imageInputRef}
                handleActiveElement={handleActiveElement}
                handleImageUpload={handleImageUpload}
              />
            ) : item?.value === "comments" ? (
              <Button className='relative h-5 w-5 object-contain'>
                <img
                  src={item.icon}
                  alt={item.name}
                  className={`absolute object-fill ${isActive(item.value) ? "invert" : ""}`}
                />
              </Button>
            ) : (
              <Button className='relative h-5 w-5 object-contain'>
                <img
                  src={item.icon}
                  alt={item.name}
                  width={20}
                  height={20}
                  className={`absolute object-fill ${isActive(item.value) ? "invert" : ""}`}
                />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <ActiveUsers />
    </nav>
  );
};

export default memo(
  Navbar,
  (prev, next) => prev.activeElement === next.activeElement
);
