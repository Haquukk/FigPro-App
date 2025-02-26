import {Canvas, Rect, Triangle, Circle, Line, IText, FabricImage, ITextProps } from "fabric";
import { v4 as uuidv4 } from "uuid";

import {
  CustomFabricObject,
  ElementDirection,
  ImageUpload,
  ModifyShape,
} from "@/types/type";
// import { read } from "fs";

export const createRectangle = (pointer: PointerEvent) => {
  const rect = new Rect({
    left: pointer.x,
    top: pointer.y,
    width: 100,
    height: 100,
    fill: "#aabbcc",
    objectId: uuidv4(),
  } as CustomFabricObject<Rect>);

  return rect;
};

export const createTriangle = (pointer: PointerEvent) => {
  return new Triangle({
    left: pointer.x,
    top: pointer.y,
    width: 100,
    height: 100,
    fill: "#aabbcc",
    objectId: uuidv4(),
  } as CustomFabricObject<Triangle>);
};

export const createCircle = (pointer: PointerEvent) => {
  return new Circle({
    left: pointer.x,
    top: pointer.y,
    radius: 100,
    fill: "#aabbcc",
    objectId: uuidv4(),
  } as any);
};

export const createLine = (pointer: PointerEvent) => {
  return new Line(
    [pointer.x, pointer.y, pointer.x + 100, pointer.y + 100],
    {
      stroke: "#aabbcc",
      strokeWidth: 2,
      objectId: uuidv4(),
    } as any);
};

export const createText = (pointer: PointerEvent, text: string) => {
  return new IText(text, {
    left: pointer.x,
    top: pointer.y,
    fill: "#aabbcc",
    fontFamily: "Helvetica",
    fontSize: 36,
    fontWeight: "400",
    objectId: uuidv4()
  } as unknown as ITextProps);
};

export const createSpecificShape = (
  shapeType: string,
  pointer: PointerEvent
) => {
  switch (shapeType) {
    case "rectangle":
      return createRectangle(pointer);

    case "triangle":
      return createTriangle(pointer);

    case "circle":
      return createCircle(pointer);

    case "line":
      return createLine(pointer);

    case "text":
      return createText(pointer, "Tap to Type");

    default:
      return null;
  }
};

// Helper function to convert RGB to hex
const rgbToHex = (rgb: any) => {
  // If already in hex format, return as is
  if (rgb.startsWith('#')) return rgb;
  
  // Handle rgb(r,g,b) format
  const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    
    return '#' + 
      (r.toString(16).padStart(2, '0')) +
      (g.toString(16).padStart(2, '0')) +
      (b.toString(16).padStart(2, '0'));
  }
  
  return rgb; // Return original if format not recognized
}

export const handleImageUpload = ({
  file,
  canvas,
  shapeRef,
  syncShapeInStorage,
}: ImageUpload) => {
  const reader = new FileReader();

  reader.onload = async () => {
    
    if(typeof reader.result === "string") {

      const imageURL = reader.result;
      try {
        const img = await FabricImage.fromURL(imageURL);
        
        img.scaleToWidth(200);
        img.scaleToHeight(200);

        img.set({objectId: uuidv4(),
          backgroundColor: "#000000",
          stroke: "#ffffff",
          fill: rgbToHex(img.fill)
        });
        
        canvas.current.add(img);
        shapeRef.current = img;
        syncShapeInStorage(img);
        
        canvas.current.requestRenderAll();
      }
      catch (error) {
        console.error("Gagal memuat gambar:", error);
      }
    } else {
      console.error("Invalid image data: reader.result is not a string.");
    }
  };

  reader.readAsDataURL(file);
};

export const createShape = (
  canvas: Canvas,
  pointer: PointerEvent,
  shapeType: string
) => {
  if (shapeType === "freeform") {
    canvas.isDrawingMode = true;
    return null;
  }

  return createSpecificShape(shapeType, pointer);
};


export const modifyShape = ({
  canvas,
  property,
  value,
  activeObjectRef,
  syncShapeInStorage,
}: ModifyShape) => {
  const selectedElement = canvas.getActiveObject();

  if (!selectedElement || selectedElement?.type === "activeSelection") return;

  // if  property is width or height, set the scale of the selected element
  if (property === "width") {
    selectedElement.set("scaleX", value / selectedElement.width);
  } else if (property === "height") {
    selectedElement.set("scaleY", value / selectedElement.height);
  } else {
    if (selectedElement[property as keyof object] === value) return;
    selectedElement.set(property as keyof object, value);
  }
  // set selectedElement to activeObjectRef
  activeObjectRef.current = selectedElement;

  syncShapeInStorage(selectedElement);
};

export const bringElement = ({
  canvas,
  direction,
  syncShapeInStorage,
}: ElementDirection) => {
  if (!canvas) return;

  // get the selected element. If there is no selected element or there are more than one selected element, return
  const selectedElement = canvas.getActiveObject();

  if (!selectedElement || selectedElement?.type === "activeSelection") return;

  // bring the selected element to the front
  if (direction === "front") {
    canvas.bringObjectToFront(selectedElement);
  } else if (direction === "back") {
    canvas.sendObjectToBack(selectedElement);
  }

  // canvas.renderAll();
  syncShapeInStorage(selectedElement);

  // re-render all objects on the canvas
};