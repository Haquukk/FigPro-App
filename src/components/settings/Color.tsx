import { Label } from "../ui/label";
import { useState } from "react";

type Props = {
  inputRef: any;
  attribute: string;
  placeholder: string;
  attributeType: string;
  handleInputChange: (
    property: string,
    value: string
  ) => void;
};

const convertTo6DigitHex = (color: string) => {
  if (color.length !== 6 && color.startsWith("#")) {
    // Konversi #rgb ke #rrggbb
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return color;
};

const Color = ({
  inputRef,
  attribute,
  placeholder,
  attributeType,
  handleInputChange,
}: Props) => {
  return (
    <div className='border-primary-grey-200 flex flex-col gap-3 border-b p-5'>
      <h3 className='text-[10px] uppercase'>
        {placeholder}
      </h3>
      <div
        className='border-primary-grey-200 flex items-center justify-around gap-2 border'
        onClick={() => inputRef.current.click()}
      >
        <input
          type='color'
          value={attribute}
          ref={inputRef}
          onChange={(e) =>
            handleInputChange(attributeType, e.target.value)
          }
        />
        <Label>{attribute}</Label>
        <Label className='bg-primary-grey-100 flex h-6 w-8 items-center justify-center text-[10px] leading-3'>
          90%
        </Label>
      </div>
    </div>
  );
};

export default Color;
